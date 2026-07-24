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

import { ConfigError } from '@lowdefy/errors';
import {
  IR_VERSION,
  NODE_KINDS,
  heading,
  text,
  markdown,
  svg,
  image,
  cell,
  table,
  stat,
  row,
  stack,
  divider,
  spacer,
  validateNode,
  validateNodes,
} from './nodes.js';

test('IR_VERSION is exported as a number', () => {
  expect(IR_VERSION).toBe(1);
});

test('NODE_KINDS lists exactly the closed node set', () => {
  expect([...NODE_KINDS].sort()).toEqual(
    [
      'divider',
      'heading',
      'image',
      'markdown',
      'row',
      'spacer',
      'stack',
      'stat',
      'svg',
      'table',
      'text',
    ].sort()
  );
});

describe('constructors produce validating nodes', () => {
  const cases = {
    heading: heading({ text: 'Sales', level: 2 }),
    text: text({ text: 'A paragraph' }),
    'text with tint': text({ text: 'Warning', tint: 'warning' }),
    markdown: markdown({ markdown: '# Title\n\ntext' }),
    svg: svg({ svg: '<svg></svg>', width: 100, height: 50 }),
    'image with dims': image({ src: 'files/logo.png', width: 120, height: 40 }),
    'image without dims': image({ src: 'files/logo.png' }),
    table: table({
      header: [cell('Name'), cell('Total')],
      rows: [[cell('Widget'), cell(12.5, '12.50')]],
    }),
    stat: stat({ label: 'Revenue', value: '$1,000' }),
    row: row({ children: [text({ text: 'a' }), text({ text: 'b' })], widths: [0.5, 0.5] }),
    stack: stack({ children: [heading({ text: 'H', level: 1 }), text({ text: 'p' })] }),
    divider: divider(),
    spacer: spacer({ width: 0.25 }),
  };

  test.each(Object.entries(cases))('%s validates and carries its kind', (_name, node) => {
    expect(() => validateNode(node)).not.toThrow();
    expect(NODE_KINDS).toContain(node.kind);
    expect(validateNode(node)).toBe(node);
  });

  test('every kind in NODE_KINDS has a covering constructor case', () => {
    const coveredKinds = new Set(Object.values(cases).map((node) => node.kind));
    expect([...coveredKinds].sort()).toEqual([...NODE_KINDS].sort());
  });
});

describe('constructor shapes', () => {
  test('heading carries text and level', () => {
    expect(heading({ text: 'H', level: 3 })).toEqual({ kind: 'heading', text: 'H', level: 3 });
  });

  test('text omits tint when absent', () => {
    expect(text({ text: 'p' })).toEqual({ kind: 'text', text: 'p' });
  });

  test('image omits width and height when absent', () => {
    expect(image({ src: 'files/a.png' })).toEqual({ kind: 'image', src: 'files/a.png' });
  });

  test('row carries children and parallel widths', () => {
    const node = row({ children: [divider()], widths: [1] });
    expect(node).toEqual({ kind: 'row', children: [{ kind: 'divider' }], widths: [1] });
  });

  test('spacer carries a width fraction', () => {
    expect(spacer({ width: 0.25 })).toEqual({ kind: 'spacer', width: 0.25 });
  });

  test('table carries a sheetName hint only when given', () => {
    expect(table({ header: [], rows: [] })).toEqual({ kind: 'table', header: [], rows: [] });
    expect(table({ header: [], rows: [], sheetName: 'Sales' })).toEqual({
      kind: 'table',
      header: [],
      rows: [],
      sheetName: 'Sales',
    });
  });
});

describe('cell shape', () => {
  test('accepts { value } (formatter did not run)', () => {
    expect(cell(42)).toEqual({ value: 42 });
  });

  test('accepts { value, formatted } (formatter ran)', () => {
    expect(cell(0.125, '12.5%')).toEqual({ value: 0.125, formatted: '12.5%' });
  });

  test('value may be null', () => {
    expect(cell(null)).toEqual({ value: null });
  });

  test('validateNode accepts a table with both cell shapes and a null value', () => {
    const node = table({
      header: [cell('Metric'), cell('Amount')],
      rows: [
        [cell('Ratio', 'Ratio'), cell(0.125, '12.5%')],
        [{ value: 'Missing' }, { value: null }],
      ],
    });
    expect(() => validateNode(node)).not.toThrow();
  });
});

describe('validateNode rejects bad input', () => {
  test('unknown kind throws ConfigError naming the kind', () => {
    expect(() => validateNode({ kind: 'chart' })).toThrow(ConfigError);
    expect(() => validateNode({ kind: 'chart' })).toThrow("Unknown report IR node kind 'chart'.");
  });

  test('unknown kind nested in a container throws naming the kind', () => {
    const node = { kind: 'stack', children: [{ kind: 'text', text: 'ok' }, { kind: 'widget' }] };
    expect(() => validateNode(node)).toThrow(ConfigError);
    expect(() => validateNode(node)).toThrow("Unknown report IR node kind 'widget'.");
  });

  test('unknown kind nested in a row throws naming the kind', () => {
    const node = { kind: 'row', widths: [1], children: [{ kind: 'bogus' }] };
    expect(() => validateNode(node)).toThrow("Unknown report IR node kind 'bogus'.");
  });

  test('non-object throws ConfigError', () => {
    expect(() => validateNode(null)).toThrow(ConfigError);
    expect(() => validateNode('heading')).toThrow(ConfigError);
    expect(() => validateNode([{ kind: 'text' }])).toThrow(ConfigError);
  });

  test('missing kind throws ConfigError', () => {
    expect(() => validateNode({ text: 'no kind' })).toThrow(ConfigError);
  });

  test('table cell without a value property throws ConfigError naming the kind', () => {
    const node = { kind: 'table', header: [{ formatted: 'x' }], rows: [] };
    expect(() => validateNode(node)).toThrow(ConfigError);
    expect(() => validateNode(node)).toThrow("Invalid report IR 'table' cell");
  });

  test('table data cell with a non-string formatted throws ConfigError', () => {
    const node = { kind: 'table', header: [], rows: [[{ value: 1, formatted: 2 }]] };
    expect(() => validateNode(node)).toThrow("'formatted' must be a string");
  });
});

describe('validateNodes', () => {
  test('validates a list and returns it unchanged', () => {
    const nodes = [heading({ text: 'H', level: 1 }), divider()];
    expect(validateNodes(nodes)).toBe(nodes);
  });

  test('throws on the first invalid node', () => {
    expect(() => validateNodes([divider(), { kind: 'nope' }])).toThrow(
      "Unknown report IR node kind 'nope'."
    );
  });
});
