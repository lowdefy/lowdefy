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
} from './static.js';

// Call a renderer with a `propertiesEval.output`-shaped block projection and
// walked `areas`. The explicit `toEqual` shape assertions pin the IR shapes.
function run(renderer, { properties = {}, areas, layout = { width: 515, fraction: 1 } } = {}) {
  return renderer.toReport({
    block: { id: 'b', blockId: 'b', type: 'X', properties },
    areas,
    layout,
    context: {},
  });
}

const text = (t) => ({ kind: 'text', text: t });

describe('Title', () => {
  test('Title maps content and level to a heading', () => {
    expect(run(Title, { properties: { content: 'Overview', level: 2 } })).toEqual({
      kind: 'heading',
      text: 'Overview',
      level: 2,
    });
  });

  test('Title defaults level to 1 like the antd block and clamps level 5 to 4', () => {
    expect(run(Title, { properties: { content: 'A' } }).level).toBe(1);
    expect(run(Title, { properties: { content: 'A', level: 5 } }).level).toBe(4);
    expect(run(Title, { properties: { content: 'A', level: 0 } }).level).toBe(1);
  });

  test('Title flattens markup in content to text', () => {
    expect(run(Title, { properties: { content: 'Q1 <b>Sales</b>' } }).text).toBe('Q1 Sales');
  });

  test('Title returns null for empty content', () => {
    expect(run(Title, { properties: {} })).toBeNull();
    expect(run(Title, { properties: { content: '' } })).toBeNull();
  });
});

describe('Paragraph', () => {
  test('Paragraph maps content to text with markup flattened', () => {
    expect(run(Paragraph, { properties: { content: 'Body' } })).toEqual(text('Body'));
    expect(run(Paragraph, { properties: { content: 'One<br/>Two' } })).toEqual(text('One\nTwo'));
  });

  test('Paragraph returns null without content', () => {
    expect(run(Paragraph, { properties: {} })).toBeNull();
  });
});

describe('Statistic', () => {
  test('Statistic formats value with precision, group separator, and prefix', () => {
    expect(
      run(Statistic, { properties: { title: 'Revenue', value: 1234.5, precision: 2, prefix: '$' } })
    ).toEqual({ kind: 'stat', label: 'Revenue', value: '$1,234.50' });
  });

  test('Statistic truncates decimals rather than rounding, matching antd', () => {
    expect(run(Statistic, { properties: { value: 1234.567, precision: 2 } }).value).toBe(
      '1,234.56'
    );
  });

  test('Statistic applies suffix and passes non-numeric values through', () => {
    expect(run(Statistic, { properties: { value: 99, suffix: '%' } }).value).toBe('99%');
    expect(run(Statistic, { properties: { value: 'N/A' } }).value).toBe('N/A');
  });

  test('Statistic flattens markup in the title', () => {
    expect(run(Statistic, { properties: { title: '<i>Net</i>', value: 1 } }).label).toBe('Net');
  });

  test('Statistic with neither label nor value is skipped', () => {
    expect(run(Statistic, { properties: {} })).toBeNull();
  });

  test('Statistic with a title and no value still renders a stat', () => {
    expect(run(Statistic, { properties: { title: 'Revenue' } })).toEqual({
      kind: 'stat',
      label: 'Revenue',
      value: '',
    });
  });
});

describe('Divider', () => {
  test('Divider without a title returns a bare divider node', () => {
    expect(run(Divider, {})).toEqual({ kind: 'divider' });
    expect(run(Divider, { properties: { title: '' } })).toEqual({ kind: 'divider' });
    expect(run(Divider, { properties: { title: null } })).toEqual({ kind: 'divider' });
  });

  test('Divider with a title adds a small section heading after the rule', () => {
    expect(run(Divider, { properties: { title: 'Revenue <em>by</em> Month' } })).toEqual([
      { kind: 'divider' },
      { kind: 'heading', text: 'Revenue by Month', level: 4 },
    ]);
  });
});

describe('Descriptions', () => {
  test('Descriptions array items become label/value rows', () => {
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

  test('Descriptions prefers key over label like the antd block', () => {
    expect(
      run(Descriptions, { properties: { items: [{ key: 'name', label: 'Name', value: 'Ada' }] } })
        .rows
    ).toEqual([[{ value: 'name' }, { value: 'Ada' }]]);
  });

  test('Descriptions object items become key/value rows', () => {
    expect(run(Descriptions, { properties: { items: { Region: 'EU' } } }).rows).toEqual([
      [{ value: 'Region' }, { value: 'EU' }],
    ]);
  });

  test('Descriptions primitive items are their own label and value', () => {
    expect(run(Descriptions, { properties: { items: ['a', 7] } }).rows).toEqual([
      [{ value: 'a' }, { value: 'a' }],
      [{ value: '7' }, { value: 7, formatted: '7' }],
    ]);
  });

  test('Descriptions itemOptions transform functions mirror the page display', () => {
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
    expect(rows).toEqual([[{ value: 'r!' }, { value: '$10' }]]);
  });

  test('Descriptions flattens markup and serialises object values so no object reaches a cell', () => {
    const rows = run(Descriptions, {
      properties: {
        items: [
          { key: '<b>Bold</b>', value: 'a <i>b</i>' },
          { key: 'obj', value: { formula: 'HYPERLINK("x")' } },
        ],
      },
    }).rows;
    expect(rows[0]).toEqual([{ value: 'Bold' }, { value: 'a b' }]);
    expect(rows[1][1].value).toBe('{"formula":"HYPERLINK(\\"x\\")"}');
  });

  test('Descriptions title becomes a heading before the table', () => {
    const result = run(Descriptions, {
      properties: { title: 'Customer', items: { Name: 'Ada' } },
    });
    expect(result[0]).toEqual({ kind: 'heading', text: 'Customer', level: 4 });
    expect(result[1].kind).toBe('table');
  });

  test('Descriptions returns null with no items', () => {
    expect(run(Descriptions, { properties: {} })).toBeNull();
  });
});

describe('Card', () => {
  test('Card stacks its title heading, then extra, cover, and content areas', () => {
    const extra = text('extra');
    const cover = text('cover');
    const body = text('body');
    expect(
      run(Card, {
        properties: { title: 'Sales <small>2026</small>' },
        areas: { content: [body], extra: [extra], cover: [cover] },
      })
    ).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'Sales 2026', level: 4 }, extra, cover, body],
    });
  });

  test('Card title area wins over the title property, as on the page', () => {
    const titleBlock = text('custom title');
    expect(
      run(Card, { properties: { title: 'Sales' }, areas: { title: [titleBlock], content: [] } })
    ).toEqual({ kind: 'stack', children: [titleBlock] });
  });

  test('Card without a title just stacks the content area', () => {
    const child = text('inner');
    expect(run(Card, { properties: {}, areas: { content: [child] } })).toEqual({
      kind: 'stack',
      children: [child],
    });
  });

  test('Card that is empty and untitled returns null', () => {
    expect(run(Card, { properties: {}, areas: { content: [] } })).toBeNull();
    expect(run(Card, { properties: {} })).toBeNull();
  });
});

describe('Content', () => {
  test('Content stacks its content area', () => {
    const child = text('x');
    expect(run(Content, { areas: { content: [child] } })).toEqual({
      kind: 'stack',
      children: [child],
    });
  });

  test('Content with an empty area returns null', () => {
    expect(run(Content, { areas: { content: [] } })).toBeNull();
    expect(run(Content, {})).toBeNull();
  });
});

describe('Alert', () => {
  test('Alert joins message and description with the severity as tint', () => {
    expect(
      run(Alert, { properties: { message: 'Heads up', description: 'Details', type: 'warning' } })
    ).toEqual({ kind: 'text', text: 'Heads up\nDetails', tint: 'warning' });
  });

  test('Alert flattens markup in message and description', () => {
    expect(run(Alert, { properties: { message: '<b>Warn</b>' } }).text).toBe('Warn');
  });

  test('Alert defaults tint to info', () => {
    expect(run(Alert, { properties: { message: 'm' } }).tint).toBe('info');
  });

  test('Alert returns null with neither message nor description', () => {
    expect(run(Alert, { properties: {} })).toBeNull();
  });
});

describe('Tabs', () => {
  test('Tabs interleave each tab title with that tab area, in tab order', () => {
    const a = text('a');
    const b = text('b');
    expect(
      run(Tabs, {
        properties: {
          tabs: [
            { key: 'x', title: 'First' },
            { key: 'y', title: 'Second' },
          ],
        },
        areas: { y: [b], x: [a] },
      })
    ).toEqual({
      kind: 'stack',
      children: [
        { kind: 'heading', text: 'First', level: 4 },
        a,
        { kind: 'heading', text: 'Second', level: 4 },
        b,
      ],
    });
  });

  test('Tabs derive the tab list from the areas when no tabs are configured, keeping the extra area last', () => {
    const a = text('a');
    const extra = text('extra');
    expect(
      run(Tabs, { properties: { extraAreaKey: 'extra' }, areas: { extra: [extra], one: [a] } })
    ).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'one', level: 4 }, a, extra],
    });
  });

  test('Tabs append areas no tab names after the configured tabs', () => {
    const a = text('a');
    const stray = text('stray');
    expect(
      run(Tabs, { properties: { tabs: [{ key: 'x', title: 'X' }] }, areas: { x: [a], z: [stray] } })
    ).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'X', level: 4 }, a, stray],
    });
  });

  test('Tabs return null with nothing to show', () => {
    expect(run(Tabs, { properties: {}, areas: {} })).toBeNull();
    expect(run(Tabs, { properties: {} })).toBeNull();
  });
});

describe('Collapse', () => {
  test('Collapse interleaves each panel title with its area and extra area', () => {
    const a = text('a');
    const more = text('more');
    expect(
      run(Collapse, {
        properties: { panels: [{ key: 'p', title: 'Panel', extraKey: 'p_extra' }] },
        areas: { p_extra: [more], p: [a] },
      })
    ).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'Panel', level: 4 }, a, more],
    });
  });

  test('Collapse derives panels from the areas when none are configured', () => {
    const a = text('a');
    expect(run(Collapse, { properties: {}, areas: { intro: [a] } })).toEqual({
      kind: 'stack',
      children: [{ kind: 'heading', text: 'intro', level: 4 }, a],
    });
  });

  test('Collapse that is empty returns null', () => {
    expect(run(Collapse, { properties: {}, areas: {} })).toBeNull();
  });
});
