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

import { validateNode } from '../../../../../reports/src/ir/nodes.js';
import {
  Title,
  Paragraph,
  Statistic,
  Divider,
  Descriptions,
  Card,
  Content,
  Alert,
  Tabs,
  Collapse,
} from './index.js';

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// validate every node it returns against the closed IR validator.
function run(renderer, { properties = {}, children, layout = {}, context = {} } = {}) {
  const result = renderer.toReport({
    block: { id: 'b', blockId: 'b', type: 'X', properties },
    children,
    layout,
    context,
  });
  const nodes = result == null ? [] : Array.isArray(result) ? result : [result];
  nodes.forEach((node) => validateNode(node));
  return result;
}

describe('Title', () => {
  test('maps content and level to a heading', () => {
    expect(run(Title, { properties: { content: 'Overview', level: 2 } })).toEqual({
      kind: 'heading',
      text: 'Overview',
      level: 2,
    });
  });

  test('defaults level to 4 and clamps antd level 5 to 4', () => {
    expect(run(Title, { properties: { content: 'A' } }).level).toBe(4);
    expect(run(Title, { properties: { content: 'A', level: 5 } }).level).toBe(4);
  });

  test('returns null for empty content', () => {
    expect(run(Title, { properties: {} })).toBeNull();
    expect(run(Title, { properties: { content: '' } })).toBeNull();
  });
});

describe('Paragraph', () => {
  test('maps content to text', () => {
    expect(run(Paragraph, { properties: { content: 'Body' } })).toEqual({
      kind: 'text',
      text: 'Body',
    });
  });

  test('returns null without content', () => {
    expect(run(Paragraph, { properties: {} })).toBeNull();
  });
});

describe('Statistic', () => {
  test('formats value with precision, group separator, and prefix', () => {
    expect(run(Statistic, { properties: { title: 'Revenue', value: 1234.5, precision: 2, prefix: '$' } })).toEqual({
      kind: 'stat',
      label: 'Revenue',
      value: '$1,234.50',
    });
  });

  test('truncates decimals rather than rounding (matches antd)', () => {
    expect(run(Statistic, { properties: { value: 1234.567, precision: 2 } }).value).toBe('1,234.56');
  });

  test('applies suffix and passes non-numeric values through', () => {
    expect(run(Statistic, { properties: { value: 99, suffix: '%' } }).value).toBe('99%');
    expect(run(Statistic, { properties: { value: 'N/A' } }).value).toBe('N/A');
  });

  test('empty title becomes an empty label; missing value an empty string', () => {
    expect(run(Statistic, { properties: {} })).toEqual({ kind: 'stat', label: '', value: '' });
  });
});

describe('Divider', () => {
  test('always returns a divider node', () => {
    expect(run(Divider, {})).toEqual({ kind: 'divider' });
  });
});

describe('Descriptions', () => {
  test('array items become label/value rows', () => {
    expect(
      run(Descriptions, {
        properties: {
          items: [
            { label: 'Name', value: 'Ada' },
            { label: 'Score', value: 42 },
          ],
        },
      })
    ).toEqual({
      kind: 'table',
      header: [{ value: '' }, { value: '' }],
      rows: [
        [{ value: 'Name' }, { value: 'Ada' }],
        [{ value: 'Score' }, { value: 42, formatted: '42' }],
      ],
    });
  });

  test('object items become key/value rows', () => {
    expect(run(Descriptions, { properties: { items: { Region: 'EU' } } }).rows).toEqual([
      [{ value: 'Region' }, { value: 'EU' }],
    ]);
  });

  test('itemOptions transform functions mirror the page display', () => {
    const rows = run(Descriptions, {
      properties: {
        items: [{ key: 'r', label: 'Rev', value: 10 }],
        itemOptions: [
          {
            key: 'r',
            transformLabel: (label) => `${label}!`,
            transformValue: (value) => `$${value}`,
          },
        ],
      },
    }).rows;
    expect(rows).toEqual([[{ value: 'Rev!' }, { value: '$10' }]]);
  });

  test('returns null with no items', () => {
    expect(run(Descriptions, { properties: {} })).toBeNull();
  });
});

describe('Card', () => {
  test('wraps children in a stack, prepending a title heading', () => {
    const child = { kind: 'text', text: 'inner' };
    expect(run(Card, { properties: { title: 'Sales' }, children: [child] })).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'Sales', level: 4 }, child],
    });
  });

  test('no title just stacks children', () => {
    const child = { kind: 'text', text: 'inner' };
    expect(run(Card, { properties: {}, children: [child] })).toEqual({
      kind: 'stack',
      children: [child],
    });
  });

  test('empty untitled card returns null', () => {
    expect(run(Card, { properties: {}, children: [] })).toBeNull();
  });
});

describe('Content', () => {
  test('stacks children', () => {
    const child = { kind: 'text', text: 'x' };
    expect(run(Content, { children: [child] })).toEqual({ kind: 'stack', children: [child] });
  });

  test('empty content returns null', () => {
    expect(run(Content, { children: [] })).toBeNull();
  });
});

describe('Alert', () => {
  test('joins message and description with the severity as tint', () => {
    expect(
      run(Alert, { properties: { message: 'Heads up', description: 'Details', type: 'warning' } })
    ).toEqual({ kind: 'text', text: 'Heads up\nDetails', tint: 'warning' });
  });

  test('defaults tint to info', () => {
    expect(run(Alert, { properties: { message: 'm' } }).tint).toBe('info');
  });

  test('returns null with neither message nor description', () => {
    expect(run(Alert, { properties: {} })).toBeNull();
  });
});

describe('Tabs', () => {
  test('linearizes tab titles as headings followed by children', () => {
    const a = { kind: 'text', text: 'a' };
    const b = { kind: 'text', text: 'b' };
    expect(
      run(Tabs, {
        properties: {
          tabs: [
            { key: 'x', title: 'First' },
            { key: 'y', title: 'Second' },
          ],
        },
        children: [a, b],
      })
    ).toEqual({
      kind: 'stack',
      children: [
        { kind: 'heading', text: 'First', level: 4 },
        { kind: 'heading', text: 'Second', level: 4 },
        a,
        b,
      ],
    });
  });

  test('without tabs metadata just stacks children', () => {
    const a = { kind: 'text', text: 'a' };
    expect(run(Tabs, { properties: {}, children: [a] })).toEqual({ kind: 'stack', children: [a] });
  });
});

describe('Collapse', () => {
  test('linearizes panel titles as headings followed by children', () => {
    const a = { kind: 'text', text: 'a' };
    expect(
      run(Collapse, { properties: { panels: [{ key: 'p', title: 'Panel' }] }, children: [a] })
    ).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'Panel', level: 4 }, a],
    });
  });

  test('empty collapse returns null', () => {
    expect(run(Collapse, { properties: {}, children: [] })).toBeNull();
  });
});
