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

// The header checkbox selects every loaded row (or clears them when all are selected). An
// explicit `{ all: true, except }` value only comes from outside (SetState, or server mode later).
function createToggleAllRowsSelected(api) {
  return function toggleAllRowsSelected() {
    if (api.config.rowSelection?.type === 'radio') return false;
    const { selectedCount, total } = countSelectedRows({ api });
    const selectAll = total > 0 && selectedCount < total;
    api.updateSlice('selectionMode', () => 'keys', { cause: 'select' });
    api.table.toggleAllRowsSelected(selectAll);
    return true;
  };
}

export default createToggleAllRowsSelected;
