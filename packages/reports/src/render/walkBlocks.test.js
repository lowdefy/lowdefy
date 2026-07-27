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
import { cell, grid, table, text } from '../ir/nodes.js';

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
    // Each child renderer is handed its resolved column width in points.
    expect(layoutLog).toEqual([
      { blockId: 'a', width: 240, fraction: 0.5 },
      { blockId: 'b', width: 240, fraction: 0.5 },
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
    // The full-width block gets the whole content width.
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
    // The offset does not change the block's own resolved column width.
    expect(layoutLog).toEqual([{ blockId: 'a', width: 360, fraction: 0.75 }]);
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
    // The child of the span-12 container is laid out within the 240pt cell.
    expect(layoutLog).toContainEqual({ blockId: 'c1', width: 240, fraction: 1 });
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
  test('a renderer returning an unknown kind throws a ConfigError', async () => {
    const context = await evaluate({
      id: 'page1',
      type: 'Box',
      blocks: [{ id: 'bad', type: 'Bogus', properties: {} }],
    });

    await expect(walkBlocks(context, stubRegistry(), {}, renderContext())).rejects.toThrow(
      /Unknown report IR node kind 'not-a-real-kind'/
    );
  });
});

describe('ignored layout features log at debug', () => {
  test('order/push/pull/responsive/flex are logged and ignored', async () => {
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
