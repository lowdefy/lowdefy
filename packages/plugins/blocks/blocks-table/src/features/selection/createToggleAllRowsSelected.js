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

import countSelectedRows from './countSelectedRows.js';
import getSelectAllState from './getSelectAllState.js';

// The header checkbox selects every row the filter shows (or clears them when all are selected),
// as their keys. In server mode most rows are not loaded, so it selects all rows the view matches
// as `{ all: true, except: [], filter, search }`, which the server resolves. Client mode writes
// that shape through the bulk bar's "Select all matching" (selectAllMatching) or from outside.
function createToggleAllRowsSelected(api) {
  return function toggleAllRowsSelected() {
    if (api.config.rowSelection?.type === 'radio') return false;
    if (api.config.server) {
      const { checked } = getSelectAllState({ api });
      api.selectionExcept.clear();
      const selection = {};
      if (!checked) {
        Object.keys(api.table.getCoreRowModel().rowsById).forEach((id) => {
          selection[id] = true;
        });
      }
      api.updateSlice('selectionMode', () => (checked ? 'keys' : 'all'), { cause: 'select' });
      api.updateSlice(
        'selectionView',
        () => (checked ? null : { filter: api.state.filter, search: api.state.search }),
        { cause: 'select' }
      );
      api.updateSlice('rowSelection', () => selection, { cause: 'select' });
      return true;
    }
    const { selectedCount, total } = countSelectedRows({ api });
    const selectAll = total > 0 && selectedCount < total;
    api.updateSlice('selectionMode', () => 'keys', { cause: 'select' });
    api.table.toggleAllRowsSelected(selectAll);
    return true;
  };
}

export default createToggleAllRowsSelected;
