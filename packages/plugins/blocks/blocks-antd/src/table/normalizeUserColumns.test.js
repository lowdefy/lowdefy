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
import needsTemplates from './needsTemplates.js';
import normalizeColumns from './normalizeColumns.js';
import USER_COLUMN_TYPES from './userColumnTypes.js';

// User-defined columns are runtime data other users wrote, rendered in every viewer's browser:
// only text-safe types and keys reach the column core.
function userColumn(column) {
  return normalizeColumns({
    columns: [{ key: 'name' }, { key: 'u', title: 'U', userDefined: true, ...column }],
  }).columnsByKey.u;
}

test('user column types are the text-safe cell types', () => {
  expect(USER_COLUMN_TYPES).toEqual([
    'text',
    'email',
    'phone',
    'url',
    'number',
    'currency',
    'percent',
    'progress',
    'rating',
    'date',
    'datetime',
    'boolean',
    'tag',
    'tags',
    'status',
    'json',
  ]);
});

test.each(USER_COLUMN_TYPES)('normalizeColumns accepts a user-defined %s column', (cellType) => {
  const column = userColumn({ kind: 'formula', type: cellType, template: '{{ name }}' });
  expect(column.invalid).toBeUndefined();
  expect(column.type).toBe(cellType);
});

test.each([
  ['html', 'formula', { template: '{{ name }}' }],
  ['image', 'input', {}],
  ['avatar', 'input', {}],
  ['people', 'input', {}],
  ['link', 'input', {}],
  ['relation', 'input', {}],
  ['buttons', 'input', {}],
  ['menu', 'input', {}],
])('normalizeColumns makes a user-defined %s column an error column', (cellType, kind, rest) => {
  const column = userColumn({ kind, type: cellType, ...rest });
  expect(column.type).toBe('text');
  expect(column.invalid).toBe(
    `User-defined column "u" can not have type "${cellType}". Use one of: ${USER_COLUMN_TYPES.join(
      ', '
    )}.`
  );
  expect(column).not.toHaveProperty('kind');
  expect(column).not.toHaveProperty('template');
});

test('a user-defined column with no type is text, whatever defaultColumn sets', () => {
  const { columnsByKey } = normalizeColumns({
    columns: [{ key: 'd' }, { key: 'u', kind: 'input', userDefined: true }],
    defaultColumn: { type: 'html' },
  });
  expect(columnsByKey.d.type).toBe('html');
  expect(columnsByKey.u.type).toBe('text');
  expect(columnsByKey.u.invalid).toBeUndefined();
});

test('normalizeColumns drops cell config, rules, validation and template tooltips from user-defined columns', () => {
  const column = userColumn({
    kind: 'formula',
    type: 'text',
    template: '{{ name }}',
    cell: { template: '<img src="https://tracker.example/x.gif">', rules: [{ style: {} }] },
    rules: [{ when: { gt: 0 }, style: { background: 'red' } }],
    validate: [{ pattern: '.*' }],
    tooltip: 'Hi {{ row.secret }}',
  });
  expect(column.cell).toEqual({});
  expect(column.rules).toEqual([]);
  expect(column.validate).toEqual([]);
  expect(column.tooltip).toBeUndefined();
  expect(column.template).toBe('{{ name }}');
  expect(needsTemplates({ columns: [column] })).toBe(false);
});

test('normalizeColumns drops a { template } tooltip but keeps a { field } tooltip on user-defined columns', () => {
  expect(
    userColumn({ kind: 'input', tooltip: { template: '{{ value }}' } }).tooltip
  ).toBeUndefined();
  expect(userColumn({ kind: 'input', tooltip: { field: 'name' } }).tooltip).toEqual({
    field: 'name',
  });
});

test('normalizeColumns keeps the layout, feature flags and kind keys of user-defined columns', () => {
  const column = userColumn({
    kind: 'input',
    type: 'tag',
    editable: true,
    field: 'values.u',
    width: 120,
    pinned: 'start',
    sortable: false,
    options: ['a', 'b'],
    headerTooltip: 'What users typed',
  });
  expect(column).toMatchObject({
    type: 'tag',
    editable: true,
    field: 'values.u',
    width: 120,
    pinned: 'start',
    sortable: false,
    headerTooltip: 'What users typed',
  });
  expect(column.options.map((option) => option.value)).toEqual(['a', 'b']);
});

test('declared columns keep html, image, cell templates and template tooltips', () => {
  const { columnsByKey } = normalizeColumns({
    columns: [
      { key: 'h', type: 'html', cell: { template: '<b>{{ value }}</b>' }, tooltip: '{{ value }}' },
      { key: 'i', type: 'image' },
    ],
  });
  expect(columnsByKey.h.cell.template).toBe('<b>{{ value }}</b>');
  expect(columnsByKey.h.tooltip).toBe('{{ value }}');
  expect(columnsByKey.i.type).toBe('image');
});
