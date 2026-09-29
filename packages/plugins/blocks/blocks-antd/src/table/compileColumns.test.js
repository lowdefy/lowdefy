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

import { nunjucksFunction } from '@lowdefy/nunjucks';

import compileColumns from './compileColumns.js';
import normalizeColumns from './normalizeColumns.js';

function compile(columns) {
  const normalized = normalizeColumns({ columns });
  return compileColumns({
    columns: normalized.columns,
    columnsByKey: normalized.columnsByKey,
    compileTemplate: nunjucksFunction,
  });
}

test('compileColumns sets the cell layout class from wrap, ellipsis, type and align', () => {
  const [text, wrapped, clamped, actions, amount] = compile([
    { key: 'a' },
    { key: 'b', wrap: true },
    { key: 'c', ellipsis: 3 },
    { key: 'd', type: 'buttons' },
    { key: 'e', type: 'number' },
  ]);
  expect(text.compiled.className).toBe('lf-table-cell lf-table-cell-nowrap');
  expect(text.compiled.style).toBeUndefined();
  expect(wrapped.compiled.className).toBe('lf-table-cell lf-table-cell-wrap');
  expect(clamped.compiled.className).toBe('lf-table-cell lf-table-cell-clamp');
  expect(clamped.compiled.style).toEqual({ '--lf-table-clamp': 3 });
  expect(actions.compiled.className).toBe('lf-table-cell lf-table-cell-actions');
  expect(amount.compiled.className).toBe(
    'lf-table-cell lf-table-cell-nowrap lf-table-cell-align-end'
  );
});

test('compileColumns compiles rules, tooltips and html templates once per column', () => {
  const [score, bio] = compile([
    { key: 'score', type: 'number', rules: [{ when: { op: 'gt', value: 1 }, color: 'red' }] },
    {
      key: 'bio',
      type: 'html',
      tooltip: { field: 'name' },
      cell: { template: '<b>{{ value }}</b>' },
    },
  ]);
  expect(score.compiled.rules({}, 2)).toEqual({
    className: undefined,
    style: { color: 'var(--ant-red-6, #f5222d)' },
  });
  expect(score.compiled.tooltip).toBeNull();
  expect(score.compiled.template).toBeNull();
  expect(bio.compiled.tooltip({ name: 'Ann' })).toBe('Ann');
  expect(bio.compiled.template({ value: '<i>' })).toBe('<b>&lt;i&gt;</b>');
});

test('compileColumns compiles when conditions of buttons and menu items by index', () => {
  const [buttons, menu] = compile([
    {
      key: 'actions',
      type: 'buttons',
      cell: {
        buttons: [
          { eventName: 'onEdit', hidden: { when: { key: 'locked', op: 'isTrue' } } },
          { eventName: 'onView', disabled: true },
        ],
      },
    },
    {
      key: 'more',
      type: 'menu',
      cell: { items: [{ eventName: 'onDelete', disabled: { when: { op: 'empty' } } }] },
    },
  ]);
  expect(buttons.compiled.buttons[0].hidden({ locked: true })).toBe(true);
  expect(buttons.compiled.buttons[0].disabled).toBeNull();
  expect(buttons.compiled.buttons[1]).toEqual({ hidden: null, disabled: null });
  expect(menu.compiled.items[0].disabled({}, null)).toBe(true);
  expect(menu.compiled.buttons).toEqual([]);
});
