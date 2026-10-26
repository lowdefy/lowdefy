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

import assert from 'node:assert/strict';
import { test } from 'vitest';

import countSelectedRows from './countSelectedRows.js';
import createToggleAllRowsSelected from './createToggleAllRowsSelected.js';
import createToggleRowSelected from './createToggleRowSelected.js';
import getEnableRowSelection from './getEnableRowSelection.js';
import getSelectAllState from './getSelectAllState.js';
import createSelectAllMatching from '../bulk/createSelectAllMatching.js';
import createToggleGroupSelected from '../grouping/createToggleGroupSelected.js';

const isSelectable = (row) => row.recheckable === true;

// A table of rows 1 to 4 where only 1, 2 and 4 are selectable. `toggleAllRowsSelected` mimics
// TanStack, which selects (and clears) only the rows `enableRowSelection` accepts; it asks
// getEnableRowSelection, so the tests cover the option the table hands TanStack.
function createApi({ rowSelection = {}, config = {}, rows } = {}) {
  const tableRows = (rows ?? [1, 2, 3, 4]).map((id) => ({
    id: String(id),
    original: { id, recheckable: id !== 3 },
    toggleSelected() {
      api.state.rowSelection = { ...api.state.rowSelection, [this.id]: true };
    },
  }));
  const rowsById = Object.fromEntries(tableRows.map((row) => [row.id, row]));
  const api = {
    config: {
      rowSelection: { type: 'checkbox', isSelectable, cascade: false, ...config },
    },
    state: { rowSelection, selectionMode: 'keys' },
    selectionExcept: new Set(),
    table: {
      getFilteredRowModel: () => ({ rows: tableRows, rowsById }),
      getCoreRowModel: () => ({ rows: tableRows, rowsById }),
      getPrePaginatedRowModel: () => ({ rows: tableRows, rowsById }),
      toggleAllRowsSelected(value) {
        const canSelect = getEnableRowSelection({ config: api.config });
        const next = { ...api.state.rowSelection };
        tableRows.forEach((row) => {
          if (!canSelect(row)) return;
          if (value) next[row.id] = true;
          if (!value) delete next[row.id];
        });
        api.state.rowSelection = next;
      },
    },
    updateSlice(name, update) {
      api.state[name] = update(api.state[name]);
    },
  };
  return api;
}

test('getEnableRowSelection accepts every row without a condition and tests the row with one', () => {
  assert.equal(getEnableRowSelection({ config: { rowSelection: null } }), false);
  assert.equal(getEnableRowSelection({ config: { rowSelection: { isSelectable: null } } }), true);
  const enable = getEnableRowSelection({ config: { rowSelection: { isSelectable } } });
  assert.equal(enable({ original: { recheckable: true } }), true);
  assert.equal(enable({ original: { recheckable: false } }), false);
});

test('toggleRowSelected refuses a row the condition rejects', () => {
  const api = createApi();
  assert.equal(createToggleRowSelected(api)({ id: '3' }), false);
  assert.deepEqual(api.state.rowSelection, {});
  assert.equal(createToggleRowSelected(api)({ id: '2' }), true);
  assert.deepEqual(api.state.rowSelection, { 2: true });
});

test('toggleRowSelected refuses a rejected row in radio mode', () => {
  const api = createApi({ config: { type: 'radio' } });
  assert.equal(createToggleRowSelected(api)({ id: '3' }), false);
  assert.deepEqual(api.state.rowSelection, {});
  assert.equal(createToggleRowSelected(api)({ id: '1' }), true);
  assert.deepEqual(api.state.rowSelection, { 1: true });
});

test('cascade selects only the selectable descendants', () => {
  const api = createApi({ config: { cascade: true } });
  api.tree = { getDescendantIds: () => ['2', '3', '4'] };
  assert.equal(createToggleRowSelected(api)({ id: '1' }), true);
  assert.deepEqual(api.state.rowSelection, { 1: true, 2: true, 4: true });
});

test('countSelectedRows counts only selectable rows', () => {
  const api = createApi({ rowSelection: { 1: true, 3: true } });
  assert.deepEqual(countSelectedRows({ api }), { selectedCount: 1, total: 3 });
});

test('the header checkbox is checked when every selectable row is selected', () => {
  const api = createApi({ rowSelection: { 1: true, 2: true, 4: true } });
  assert.deepEqual(getSelectAllState({ api }), { checked: true, indeterminate: false });
  api.state.rowSelection = { 1: true };
  assert.deepEqual(getSelectAllState({ api }), { checked: false, indeterminate: true });
  api.state.rowSelection = {};
  assert.deepEqual(getSelectAllState({ api }), { checked: false, indeterminate: false });
});

test('a table with no selectable rows never reads as checked', () => {
  const api = createApi({ rows: [3] });
  assert.deepEqual(getSelectAllState({ api }), { checked: false, indeterminate: false });
  createToggleAllRowsSelected(api)();
  assert.deepEqual(api.state.rowSelection, {});
});

test('toggleAllRowsSelected selects the selectable rows, then clears them', () => {
  const api = createApi();
  createToggleAllRowsSelected(api)();
  assert.deepEqual(api.state.rowSelection, { 1: true, 2: true, 4: true });
  createToggleAllRowsSelected(api)();
  assert.deepEqual(api.state.rowSelection, {});
});

test('server-mode toggleAllRowsSelected selects only the selectable loaded rows', () => {
  const api = createApi({ config: {} });
  api.config.server = {};
  createToggleAllRowsSelected(api)();
  assert.deepEqual(api.state.rowSelection, { 1: true, 2: true, 4: true });
});

test('selectAllMatching skips rows the condition rejects', () => {
  const api = createApi();
  api.selectionExcept = new Set();
  createSelectAllMatching(api)();
  assert.deepEqual(api.state.rowSelection, { 1: true, 2: true, 4: true });
});

test('the group checkbox selects only selectable leaves', () => {
  const api = createApi();
  const leaves = Object.values(api.table.getCoreRowModel().rowsById);
  api.grouping = {
    tree: { leaves, groupsByKey: new Map([['g', { start: 0, end: 4 }]]) },
  };
  assert.equal(createToggleGroupSelected(api)({ key: 'g' }), true);
  assert.deepEqual(api.state.rowSelection, { 1: true, 2: true, 4: true });
  createToggleGroupSelected(api)({ key: 'g' });
  assert.deepEqual(api.state.rowSelection, {});
});
