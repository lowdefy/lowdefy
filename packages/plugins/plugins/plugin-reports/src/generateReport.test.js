/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import buildTestPage from '@lowdefy/build/buildTestPage';
import { ConfigError } from '@lowdefy/errors';
import * as operatorsClient from '@lowdefy/operators-js/operators/client';

import generateReport from './generateReport.js';
import { ReportBusyError, ReportTimeoutError } from './errors.js';
import { heading, markdown, text } from './ir/nodes.js';

const operators = { ...operatorsClient };

// A mock static-renderer registry. The real per-block renderers live in the
// block packages (blocks-antd, blocks-markdown, …) and land in their own task;
// the orchestrator only needs a `blockType → { toReport }` map, so these stubs
// exercise generateReport end to end — including the pdf and markdown
// translation — without depending on those packages.
const registry = {
  Title: {
    toReport: ({ block }) =>
      heading({ text: block.properties.content, level: block.properties.level ?? 1 }),
  },
  Paragraph: {
    toReport: ({ block }) => text({ text: block.properties.content }),
  },
  Markdown: {
    toReport: ({ block }) => markdown({ markdown: block.properties.content }),
  },
};

const blockMetas = {
  Box: { category: 'container' },
  Title: { category: 'display' },
  Paragraph: { category: 'display' },
  Statistic: { category: 'display' },
  Markdown: { category: 'display' },
  Widget: { category: 'display' },
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

// A gated request executor: every callRequest records its call and hangs until
// the gate opens, then resolves. Opening the gate releases all pending and
// future calls. This makes "how many generations have started" observable —
// each started generation issues exactly one request during its init drain.
function gatedRequests() {
  const calls = [];
  let open = false;
  let openWaiters = [];
  const gate = () =>
    open ? Promise.resolve() : new Promise((resolve) => openWaiters.push(resolve));
  const callRequest = async (payload) => {
    calls.push(payload);
    await gate();
    return { response: null };
  };
  const openGate = () => {
    open = true;
    openWaiters.forEach((resolve) => resolve());
    openWaiters = [];
  };
  return { calls, callRequest, openGate };
}

// A page whose onInit issues one request, so its generation blocks in the drain
// until the gate opens.
function requestPage() {
  return buildTestPage({
    pageConfig: {
      id: 'page1',
      type: 'Box',
      events: { onInit: [{ id: 'req', type: 'Request', params: 'getData' }] },
      requests: [{ id: 'getData', type: 'Fetch' }],
      blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'hi' } }],
    },
  });
}

function baseOptions(overrides = {}) {
  return {
    pageConfig: requestPage(),
    format: 'pdf',
    operators,
    blockMetas,
    registry,
    serverUrl: 'https://reports.example.com',
    callRequest: () => Promise.resolve({ response: null }),
    ...overrides,
  };
}

describe('concurrency semaphore', () => {
  test('a third concurrent call waits for a slot', async () => {
    const { calls, callRequest, openGate } = gatedRequests();

    const p1 = generateReport(baseOptions({ callRequest }));
    const p2 = generateReport(baseOptions({ callRequest }));
    const p3 = generateReport(baseOptions({ callRequest }));

    // Two slots run; the third is queued and has not started evaluating.
    await tick();
    expect(calls).toHaveLength(2);

    // Release the running pair; the queued generation then acquires a slot.
    openGate();
    await Promise.all([p1, p2, p3]);
    expect(calls).toHaveLength(3);
  });
});

describe('generation timeout', () => {
  test('rejects with a ReportTimeoutError naming the page', async () => {
    // A request that never settles wedges the drain; the timeout must fire.
    const neverSettles = () => new Promise(() => {});
    const promise = generateReport(baseOptions({ callRequest: neverSettles, timeoutMs: 50 }));

    await expect(promise).rejects.toThrow(ReportTimeoutError);
    await expect(promise).rejects.toThrow(/page 'page1'/);
  });

  test('a timed-out generation stops and gives its slot back', async () => {
    // The bound only holds if the work actually stops: releasing the slot while
    // a wedged render kept its engine context alive would let orphans pile up
    // past MAX_CONCURRENT. Wedge both slots, then check that a later generation
    // still runs — which it can only do once both aborted runs have unwound.
    const neverSettles = () => new Promise(() => {});
    const wedged = [
      generateReport(baseOptions({ callRequest: neverSettles, timeoutMs: 30 })),
      generateReport(baseOptions({ callRequest: neverSettles, timeoutMs: 30 })),
    ];
    await Promise.all(wedged.map((promise) => expect(promise).rejects.toThrow(ReportTimeoutError)));

    const result = await generateReport(
      baseOptions({
        pageConfig: buildTestPage({
          pageConfig: {
            id: 'page1',
            type: 'Box',
            blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'after' } }],
          },
        }),
      })
    );
    expect(result.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});

describe('a full queue fails fast', () => {
  test('callers past the queue bound reject with a ReportBusyError', async () => {
    // MAX_CONCURRENT running + MAX_QUEUED waiting = 10 accepted; the 11th is
    // refused rather than parked on an open connection until its own timeout.
    const { callRequest, openGate } = gatedRequests();
    const accepted = Array.from({ length: 10 }, () => generateReport(baseOptions({ callRequest })));

    await expect(generateReport(baseOptions({ callRequest }))).rejects.toThrow(ReportBusyError);
    await expect(generateReport(baseOptions({ callRequest }))).rejects.toThrow(/page 'page1'/);

    openGate();
    await Promise.all(accepted);
  });
});

describe('unsupported format', () => {
  test('rejects with a ConfigError — the caller asked for something not offered', async () => {
    await expect(generateReport(baseOptions({ format: 'docx' }))).rejects.toThrow(ConfigError);
    await expect(generateReport(baseOptions({ format: 'docx' }))).rejects.toThrow(
      "Report format 'docx' is not supported"
    );
  });
});

describe('pdf generation', () => {
  test('returns %PDF bytes, contentType, filename, and aggregated warnings', async () => {
    const pageConfig = buildTestPage({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        events: {
          // A browser-only action is skipped and recorded.
          onInit: [{ id: 'scroll', type: 'ScrollTo', params: { blockId: 'page1' } }],
        },
        blocks: [
          { id: 't', type: 'Title', properties: { content: 'Report', level: 1 } },
          { id: 'p', type: 'Paragraph', properties: { content: 'Body text' } },
          // An unrenderable type is skipped and recorded by the walk.
          { id: 'w', type: 'Widget', properties: {} },
        ],
      },
    });

    const result = await generateReport(
      baseOptions({ pageConfig, now: new Date('2026-01-01T00:00:00.000Z') })
    );

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(result.contentType).toBe('application/pdf');
    expect(result.filename).toBe('page1.pdf');

    expect(result.warnings.skippedActions).toHaveLength(1);
    expect(result.warnings.skippedActions[0].actionType).toBe('ScrollTo');
    expect(result.warnings.skippedBlockTypes).toEqual([{ blockType: 'Widget', blockIds: ['w'] }]);
  });

  test('a Markdown block renders end to end, operators evaluated in its content', async () => {
    const pageConfig = buildTestPage({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        blocks: [
          {
            id: 'md',
            type: 'Markdown',
            properties: {
              content: {
                // The content is operator-evaluated like any other property.
                _string: {
                  concat: [
                    '# Markdown heading\n\nProse with **bold** and a table.\n\n',
                    '| Region | Total |\n| --- | ---: |\n| North | 100 |\n',
                  ],
                },
              },
            },
          },
        ],
      },
    });

    const result = await generateReport(baseOptions({ pageConfig }));

    expect(result.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // No blocks were skipped: the Markdown type resolved through the registry.
    expect(result.warnings.skippedBlockTypes).toEqual([]);
    expect(result.buffer.length).toBeGreaterThan(1000);
  });

  test('logs the warning summary once per generation', async () => {
    const pageConfig = buildTestPage({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        blocks: [{ id: 'w', type: 'Widget', properties: {} }],
      },
    });
    const warnings = [];
    const logger = {
      debug: () => {},
      warn: (meta, message) => warnings.push({ meta, message }),
      error: () => {},
    };

    await generateReport(baseOptions({ pageConfig, logger }));

    expect(warnings).toHaveLength(1);
    expect(warnings[0].meta.pageId).toBe('page1');
  });
});

describe('xlsx format', () => {
  // A minimal tabular renderer: any `Grid` block projects to a grid IR node.
  // (The real AgGrid static renderer lands in its own package/task; this stub
  // exercises the xlsx projection end to end without that dependency.)
  const gridRegistry = {
    Grid: {
      toReport: ({ block }) => ({
        kind: 'grid',
        sheetName: block.properties.sheetName,
        header: [{ value: 'Region' }, { value: 'Total' }],
        rows: [
          [{ value: 'North' }, { value: 100 }],
          [{ value: 'South' }, { value: 250 }],
        ],
      }),
    },
  };
  const gridMetas = { ...blockMetas, Grid: { category: 'display' } };

  test('returns xlsx contentType, filename, and a workbook buffer', async () => {
    const pageConfig = buildTestPage({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        blocks: [{ id: 'g', type: 'Grid', properties: { sheetName: 'Sales' } }],
      },
    });

    const result = await generateReport(
      baseOptions({ pageConfig, format: 'xlsx', registry: gridRegistry, blockMetas: gridMetas })
    );

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    // The xlsx container is a zip; it starts with the PK signature.
    expect(result.buffer.subarray(0, 2).toString('latin1')).toBe('PK');
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(result.filename).toBe('page1.xlsx');
  });

  test('a page with no grids rejects rather than emitting an empty workbook', async () => {
    const pageConfig = buildTestPage({
      pageConfig: {
        id: 'page1',
        type: 'Box',
        blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'hi' } }],
      },
    });

    await expect(generateReport(baseOptions({ pageConfig, format: 'xlsx' }))).rejects.toThrow(
      'no grids to export'
    );
  });
});
