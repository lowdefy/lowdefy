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

import getRawRowKey from './getRawRowKey.js';

// In an `{ all: true, except }` selection, a row cleared by the user joins `except` and a row
// selected again leaves it. The exceptions are recorded here, where the user acts, rather than
// inferred from unselected loaded rows: a row that has just loaded is not selected yet either.
function recordExceptions({ api, ids, selected }) {
  if (api.state.selectionMode !== 'all') return;
  ids.forEach((rowId) => {
    if (selected) {
      api.selectionExcept.set(rowId, getRawRowKey({ id: rowId, api }));
    } else {
      api.selectionExcept.delete(rowId);
    }
  });
}

// TanStack's row toggle never clears other rows, so radio (single) selection replaces the record.
// With `rowSelection.cascade` in a tree, a row's descendants follow it.
function createToggleRowSelected(api) {
  return function toggleRowSelected({ id }) {
    if (!api.config.rowSelection) return false;
    const row = api.table.getRow(id, true);
    if (!row) return false;
    const selected = api.state.rowSelection[id] === true;
    if (api.config.rowSelection.type === 'radio') {
      api.updateSlice('rowSelection', () => (selected ? {} : { [id]: true }), { cause: 'select' });
      return true;
    }
    if (api.config.rowSelection.cascade && api.tree) {
      const ids = [id, ...api.tree.getDescendantIds(id)];
      recordExceptions({ api, ids, selected });
      api.updateSlice(
        'rowSelection',
        (previous) => {
          const next = { ...previous };
          ids.forEach((rowId) => {
            if (selected) {
              delete next[rowId];
            } else {
              next[rowId] = true;
            }
          });
          return next;
        },
        { cause: 'select' }
      );
      return true;
    }
    recordExceptions({ api, ids: [id], selected });
    row.toggleSelected();
    return true;
  };
}

export default createToggleRowSelected;
