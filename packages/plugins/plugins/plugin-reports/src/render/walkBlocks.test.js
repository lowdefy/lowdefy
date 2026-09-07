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
import * as operatorsClient from '@lowdefy/operators-js/operators/client';

import evaluatePage from '../evaluatePage/evaluatePage.js';
import walkBlocks from './walkBlocks.js';
import { cell, grid, text } from '../ir/nodes.js';

const operators = { ...operatorsClient };

const blockMetas = {
  Box: { category: 'container' },
  Paragraph: { category: 'display' },
  Stat: { category: 'display' },
  List: { category: 'list', valueType: 'array' },
  TextInput: { category: 'input', valueType: 'string' },
  Widget: { category: 'display' },
  Bogus: { category: 'display' },
};

// Build + evaluate a page the way evaluatePage's own tests do, returning the
// evaluated engine context for the walker to consume.
async function evaluate(pageConfig) {
  const { context } = await evaluatePage({
    pageConfig: buildTestPage({ pageConfig }),
    operators,
    blockMetas,
    callRequest: () => Promise.resolve({ response: null }),
    serverUrl: 'https://reports.example.com',
  });
  return context;
}

// A stub registry: Paragraph → text (recording the layout it was handed),
// Stat → text, and a deliberately broken renderer for the bad-kind test.
function stubRegistry(layoutLog = []) {
  return {
    Paragraph: {
      toReport: ({ block, layout }) => {
        layoutLog.push({ blockId: block.blockId, width: layout.width, fraction: layout.fraction });
        return text({ text: block.properties.content });
      },
    },
    Stat: {
      toReport: ({ block }) => text({ text: block.properties.content }),
    },
    Bogus: {
      toReport: () => ({ kind: 'not-a-real-kind' }),
    },
  };
}

const CONTENT_WIDTH = 480;
// The gutter pdfmake places between columns; a cell is sized against the row
// minus its gutters.
const COLUMN_GAP = 8;

function renderContext(extra = {}) {
  return { contentWidth: CONTENT_WIDTH, ...extra };
}

describe('layout row grouping', () => {
  test('span 12 + 12 produces one row with two 0.5 fractions', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
        { id: 'b', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'B' } },
      ],
    });
    const layoutLog = [];
    const { nodes, warnings } = await walkBlocks(
      context,
      stubRegistry(layoutLog),
      {},
      renderContext()
    );

    expect(warnings).toEqual([]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].widths).toEqual([0.5, 0.5]);
    expect(nodes[0].children).toEqual([text({ text: 'A' }), text({ text: 'B' })]);
    // Each child renderer is handed its resolved column width in points: half
    // the row once the gutter between the two columns is taken out.
    expect(layoutLog).toEqual([
      { blockId: 'a', width: (CONTENT_WIDTH - COLUMN_GAP) / 2, fraction: 0.5 },
      { blockId: 'b', width: (CONTENT_WIDTH - COLUMN_GAP) / 2, fraction: 0.5 },
    ]);
  });

  test('span 12 + 24 produces a row then a full-width node', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
        { id: 'b', type: 'Paragraph', layout: { span: 24 }, properties: { content: 'B' } },
      ],
    });
    const layoutLog = [];
    const { nodes } = await walkBlocks(context, stubRegistry(layoutLog), {}, renderContext());

    expect(nodes).toHaveLength(2);
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].widths).toEqual([0.5]);
    expect(nodes[0].children).toEqual([text({ text: 'A' })]);
    expect(nodes[1]).toEqual(text({ text: 'B' }));
    // A lone column has no gutter; the full-width block gets the whole width.
    expect(layoutLog).toEqual([
      { blockId: 'a', width: 240, fraction: 0.5 },
      { blockId: 'b', width: 480, fraction: 1 },
    ]);
  });

  test('a block with no span is full width and ends any open row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
        { id: 'b', type: 'Paragraph', properties: { content: 'B' } },
        { id: 'c', type: 'Paragraph', layout: { span: 8 }, properties: { content: 'C' } },
        { id: 'd', type: 'Paragraph', layout: { span: 8 }, properties: { content: 'D' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes.map((n) => n.kind)).toEqual(['row', 'text', 'row']);
    expect(nodes[0].widths).toEqual([0.5]);
    expect(nodes[1]).toEqual(text({ text: 'B' }));
    expect(nodes[2].widths).toEqual([1 / 3, 1 / 3]);
  });

  test('sums exceeding 24 start a new row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
        { id: 'b', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'B' } },
        { id: 'c', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'C' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes.map((n) => n.kind)).toEqual(['row', 'row']);
    expect(nodes[0].children).toEqual([text({ text: 'A' }), text({ text: 'B' })]);
    expect(nodes[1].children).toEqual([text({ text: 'C' })]);
  });

  test('offset 6 + span 18 produces a leading spacer(0.25) child', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'a',
          type: 'Paragraph',
          layout: { span: 18, offset: 6 },
          properties: { content: 'A' },
        },
      ],
    });
    const layoutLog = [];
    const { nodes } = await walkBlocks(context, stubRegistry(layoutLog), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].widths).toEqual([0.25, 0.75]);
    expect(nodes[0].children[0]).toEqual({ kind: 'spacer', width: 0.25 });
    expect(nodes[0].children[1]).toEqual(text({ text: 'A' }));
    // The spacer is a column too, so one gutter comes out before the fraction.
    expect(layoutLog).toEqual([
      { blockId: 'a', width: (CONTENT_WIDTH - COLUMN_GAP) * 0.75, fraction: 0.75 },
    ]);
  });
});

describe('filtering', () => {
  test('invisible, excluded, and input blocks are absent', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'keep', type: 'Paragraph', properties: { content: 'keep' } },
        { id: 'hidden', type: 'Paragraph', visible: false, properties: { content: 'hidden' } },
        { id: 'excluded', type: 'Paragraph', properties: { content: 'excluded' } },
        { id: 'field', type: 'TextInput' },
      ],
    });
    const { nodes, warnings } = await walkBlocks(
      context,
      stubRegistry(),
      { excluded: { exclude: true } },
      renderContext()
    );

    expect(warnings).toEqual([]);
    expect(nodes).toEqual([text({ text: 'keep' })]);
  });
});

describe('unsupported block types', () => {
  test('an unsupported type is recorded once with all its blockIds', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'w1', type: 'Widget', properties: {} },
        { id: 'ok', type: 'Paragraph', properties: { content: 'ok' } },
        { id: 'w2', type: 'Widget', properties: {} },
      ],
    });
    const { nodes, warnings } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    // No placeholder boxes: unsupported leaves emit nothing.
    expect(nodes).toEqual([text({ text: 'ok' })]);
    expect(warnings).toEqual([{ blockType: 'Widget', blockIds: ['w1', 'w2'] }]);
  });
});

describe('container passthrough', () => {
  test('a container with no renderer passes its children through and warns', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          blocks: [
            { id: 'c1', type: 'Paragraph', properties: { content: 'inner-1' } },
            { id: 'c2', type: 'Paragraph', properties: { content: 'inner-2' } },
          ],
        },
      ],
    });
    const { nodes, warnings } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toEqual([text({ text: 'inner-1' }), text({ text: 'inner-2' })]);
    expect(warnings).toEqual([{ blockType: 'Box', blockIds: ['card'] }]);
  });

  test('a container in a row cell carries its resolved width down to children', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          layout: { span: 12 },
          blocks: [{ id: 'c1', type: 'Paragraph', properties: { content: 'inner' } }],
        },
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
      ],
    });
    const layoutLog = [];
    const { nodes } = await walkBlocks(context, stubRegistry(layoutLog), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].children).toEqual([text({ text: 'inner' }), text({ text: 'A' })]);
    // The child of the span-12 container is laid out within its cell.
    expect(layoutLog).toContainEqual({
      blockId: 'c1',
      width: (CONTENT_WIDTH - COLUMN_GAP) / 2,
      fraction: 1,
    });
  });
});

describe('page break hints', () => {
  test('report.pageBreakBefore attaches to the first emitted node', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'a', type: 'Paragraph', properties: { content: 'A' } }],
    });
    const { nodes } = await walkBlocks(
      context,
      stubRegistry(),
      { a: { pageBreakBefore: true } },
      renderContext()
    );

    expect(nodes).toEqual([{ ...text({ text: 'A' }), pageBreakBefore: true }]);
  });
});

describe('sheet names', () => {
  const tableRegistry = {
    Widget: {
      toReport: () => grid({ header: [cell('h')], rows: [[cell(1)]] }),
    },
  };

  test('a grid node takes the report sheetName hint, else the blockId', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'sales', type: 'Widget' },
        { id: 'costs', type: 'Widget' },
      ],
    });
    const { nodes } = await walkBlocks(
      context,
      tableRegistry,
      { sales: { sheetName: 'Monthly Sales' } },
      renderContext()
    );

    expect(nodes.map((node) => node.sheetName)).toEqual(['Monthly Sales', 'costs']);
  });

  test('a renderer-set sheetName is not overwritten', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'a', type: 'Widget' }],
    });
    const named = {
      Widget: {
        toReport: () => grid({ header: [cell('h')], rows: [[cell(1)]], sheetName: 'Fixed' }),
      },
    };
    const { nodes } = await walkBlocks(context, named, {}, renderContext());

    expect(nodes[0].sheetName).toEqual('Fixed');
  });
});

describe('IR validation', () => {
  test('a renderer returning an unknown kind skips the block and records a render error', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'bad', type: 'Bogus', properties: {} }],
    });

    // Malformed IR from a renderer degrades to a skipped block rather than
    // failing the whole report — a renderer bug must not lose the document.
    const { nodes, renderErrors } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toEqual([]);
    expect(renderErrors).toEqual([
      {
        blockType: 'Bogus',
        blockIds: ['bad'],
        message: "Unknown report IR node kind 'not-a-real-kind'.",
      },
    ]);
  });

  test('a renderer that throws skips the block and records a render error', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'boom', type: 'Widget', properties: {} }],
    });

    const registry = {
      Widget: {
        toReport: () => {
          throw new Error('renderer blew up');
        },
      },
    };
    const { nodes, renderErrors } = await walkBlocks(context, registry, {}, renderContext());

    expect(nodes).toEqual([]);
    expect(renderErrors).toEqual([
      { blockType: 'Widget', blockIds: ['boom'], message: 'renderer blew up' },
    ]);
  });
});

describe('hidden and aborted', () => {
  test('a block with span 0 is treated as hidden', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'shown', type: 'Paragraph', properties: { content: 'shown' }, layout: { span: 12 } },
        { id: 'hidden', type: 'Paragraph', properties: { content: 'hidden' }, layout: { span: 0 } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());
    const texts = JSON.stringify(nodes);
    expect(texts).toContain('shown');
    expect(texts).not.toContain('hidden');
  });

  test('an already-aborted signal stops the walk', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'x' } }],
    });
    const controller = new AbortController();
    controller.abort(new Error('deadline passed'));
    await expect(
      walkBlocks(context, stubRegistry(), {}, renderContext({ signal: controller.signal }))
    ).rejects.toThrow('deadline passed');
  });
});

describe('flex children sit inline', () => {
  // In the Lowdefy grid, flex/grow/shrink/size make a block a content-sized flex
  // child sharing a line with its siblings — the icon-plus-label tile pattern.
  test('consecutive flex siblings form one row, the last taking the slack', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'icon',
          type: 'Paragraph',
          layout: { flex: '0 1 auto' },
          properties: { content: '^' },
        },
        {
          id: 'label',
          type: 'Paragraph',
          layout: { flex: '0 1 auto' },
          properties: { content: '12%' },
        },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].widths).toEqual(['auto', 'fill']);
  });

  test('a growing flex child fills, and siblings stay content-sized', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'icon', type: 'Paragraph', layout: { size: 'auto' }, properties: { content: '^' } },
        { id: 'label', type: 'Paragraph', layout: { grow: 1 }, properties: { content: '12%' } },
        {
          id: 'end',
          type: 'Paragraph',
          layout: { flex: '0 1 auto' },
          properties: { content: 'x' },
        },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes[0].widths).toEqual(['auto', 'fill', 'auto']);
  });

  test('a lone flex child needs no row wrapper', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'only', type: 'Paragraph', layout: { flex: true }, properties: { content: 'A' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe('text');
  });

  test('a full-width block ends an open flex row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { flex: '0 1 auto' }, properties: { content: 'a' } },
        { id: 'b', type: 'Paragraph', properties: { content: 'b' } },
        { id: 'c', type: 'Paragraph', layout: { flex: '0 1 auto' }, properties: { content: 'c' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes.map((node) => node.kind)).toEqual(['text', 'text', 'text']);
  });

  // Spans and flex children size against different things, so a row that held
  // both would overflow: the document renderer resolves the fractions against
  // the whole row and leaves the content-sized child nothing, which collapses it
  // to its minimum and pushes the row past the page margin.
  test('a flex child after a span column starts a new row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'a' } },
        { id: 'b', type: 'Paragraph', layout: { flex: '0 1 auto' }, properties: { content: 'b' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ kind: 'row', widths: [0.5] });
    // A lone flex child needs no row wrapper.
    expect(nodes[1].kind).toBe('text');
  });

  test('a span column after a flex child starts a new row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'a' } },
        { id: 'b', type: 'Paragraph', layout: { flex: true }, properties: { content: 'b' } },
        { id: 'c', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'c' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes.map((node) => node.kind)).toEqual(['row', 'text', 'row']);
    expect(nodes[0].widths).toEqual([0.5]);
    expect(nodes[2].widths).toEqual([0.5]);
  });
});

describe('deferred cell rendering', () => {
  // A chart bakes its width into its SVG, so it has to know how many siblings
  // share its row before it renders — the review's three-full-width-charts bug.
  test('three flex: 1 siblings each render at one third of the row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { flex: 1 }, properties: { content: 'a' } },
        { id: 'b', type: 'Paragraph', layout: { flex: 1 }, properties: { content: 'b' } },
        { id: 'c', type: 'Paragraph', layout: { flex: 1 }, properties: { content: 'c' } },
      ],
    });
    const layoutLog = [];
    const { nodes } = await walkBlocks(context, stubRegistry(layoutLog), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].widths).toEqual(['fill', 'fill', 'fill']);
    const third = (CONTENT_WIDTH - 2 * COLUMN_GAP) / 3;
    expect(layoutLog.map((entry) => entry.width)).toEqual([third, third, third]);
  });

  test('a row cell whose render yields nothing is dropped with its width', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 8 }, properties: { content: 'a' } },
        { id: 'gone', type: 'Widget', layout: { span: 8 } },
        { id: 'c', type: 'Paragraph', layout: { span: 8 }, properties: { content: 'c' } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toHaveLength(1);
    expect(nodes[0].widths).toEqual([1 / 3, 1 / 3]);
    expect(nodes[0].children).toEqual([text({ text: 'a' }), text({ text: 'c' })]);
  });

  test('a row whose every cell renders nothing emits nothing', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        { id: 'w1', type: 'Widget', layout: { span: 12 } },
        { id: 'w2', type: 'Widget', layout: { span: 12 } },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());
    expect(nodes).toEqual([]);
  });
});

describe('areas and items', () => {
  const ITEMS = [{ label: 'one' }, { label: 'two' }];
  const tabsRegistry = (received) => ({
    Box: {
      toReport: ({ block, areas }) => {
        received.push({ blockId: block.blockId, areas });
        return Object.values(areas).flat();
      },
    },
    Paragraph: { toReport: ({ block }) => text({ text: block.properties.content }) },
  });

  test('a container receives its walked children grouped by area name', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'tabs',
          type: 'Box',
          areas: {
            first: { blocks: [{ id: 'f', type: 'Paragraph', properties: { content: 'F' } }] },
            second: { blocks: [{ id: 's', type: 'Paragraph', properties: { content: 'S' } }] },
          },
        },
      ],
    });
    const received = [];
    await walkBlocks(context, tabsRegistry(received), {}, renderContext());

    const tabs = received.find((entry) => entry.blockId === 'tabs');
    expect(tabs.areas).toEqual({
      first: [text({ text: 'F' })],
      second: [text({ text: 'S' })],
    });
  });

  test('a leaf receives neither areas nor items', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'p', type: 'Paragraph', properties: { content: 'p' } }],
    });
    const seen = [];
    const registry = {
      Paragraph: {
        toReport: ({ areas, items }) => {
          seen.push({ areas, items });
          return null;
        },
      },
    };
    await walkBlocks(context, registry, {}, renderContext());
    expect(seen).toEqual([{ areas: undefined, items: undefined }]);
  });

  test('rows never span two areas of one container', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          areas: {
            content: {
              blocks: [
                { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'a' } },
              ],
            },
            extra: {
              blocks: [
                { id: 'b', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'b' } },
              ],
            },
          },
        },
      ],
    });
    const received = [];
    const { nodes } = await walkBlocks(context, tabsRegistry(received), {}, renderContext());

    // Two half-width rows, one per area — not one row holding both.
    expect(nodes.map((node) => node.kind)).toEqual(['row', 'row']);
    expect(nodes[0].widths).toEqual([0.5]);
    expect(nodes[1].widths).toEqual([0.5]);
  });

  test('a list receives one areas object per item, and items never share a row', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      events: { onInit: [{ id: 'set', type: 'SetState', params: { items: ITEMS } }] },
      blocks: [
        {
          id: 'items',
          type: 'List',
          blocks: [
            {
              id: 'items.$.label',
              type: 'Paragraph',
              layout: { span: 12 },
              properties: { content: { _state: 'items.$.label' } },
            },
          ],
        },
      ],
    });
    const received = [];
    const registry = {
      List: {
        toReport: ({ items }) => {
          received.push(items);
          return items.flatMap((areas) => Object.values(areas).flat());
        },
      },
      Paragraph: { toReport: ({ block }) => text({ text: block.properties.content }) },
    };
    const { nodes } = await walkBlocks(context, registry, {}, renderContext());

    expect(received[0]).toEqual([
      { content: [{ kind: 'row', widths: [0.5], children: [text({ text: 'one' })] }] },
      { content: [{ kind: 'row', widths: [0.5], children: [text({ text: 'two' })] }] },
    ]);
    // In the browser each item starts on its own line; the two span-12 blocks
    // must not pair up into one row here.
    expect(nodes.map((node) => node.kind)).toEqual(['row', 'row']);
  });

  test('a list with no renderer passes every item through in order', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      events: { onInit: [{ id: 'set', type: 'SetState', params: { items: ITEMS } }] },
      blocks: [
        {
          id: 'items',
          type: 'List',
          blocks: [
            {
              id: 'items.$.label',
              type: 'Paragraph',
              properties: { content: { _state: 'items.$.label' } },
            },
          ],
        },
      ],
    });
    const { nodes, warnings } = await walkBlocks(context, stubRegistry(), {}, renderContext());
    expect(nodes).toEqual([text({ text: 'one' }), text({ text: 'two' })]);
    expect(warnings).toEqual([{ blockType: 'List', blockIds: ['items'] }]);
  });

  test('a container with no renderer passes its areas through in area order', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Box',
          areas: {
            title: { blocks: [{ id: 't', type: 'Paragraph', properties: { content: 'T' } }] },
            content: { blocks: [{ id: 'c', type: 'Paragraph', properties: { content: 'C' } }] },
          },
        },
      ],
    });
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext());
    expect(nodes).toEqual([text({ text: 'T' }), text({ text: 'C' })]);
  });
});

describe('ignored layout features log at debug', () => {
  test('order/push/pull/responsive are logged and ignored', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [
        {
          id: 'a',
          type: 'Paragraph',
          layout: { span: 12, order: 2, push: 3, sm: { span: 24 } },
          properties: { content: 'A' },
        },
      ],
    });
    const debug = [];
    const logger = { debug: (meta, message) => debug.push({ meta, message }) };
    const { nodes } = await walkBlocks(context, stubRegistry(), {}, renderContext({ logger }));

    // The block still renders on its span; the extras are dropped.
    expect(nodes[0].kind).toBe('row');
    expect(nodes[0].widths).toEqual([0.5]);
    expect(debug).toHaveLength(1);
    expect(debug[0].meta).toEqual({ blockId: 'a', ignored: ['order', 'push', 'sm'] });
  });
});

describe('empty page', () => {
  test('a page with no children returns no nodes and no warnings', async () => {
    const context = await evaluate({ id: 'page1', type: 'Box' });
    const { nodes, warnings } = await walkBlocks(context, stubRegistry(), {}, renderContext());

    expect(nodes).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
