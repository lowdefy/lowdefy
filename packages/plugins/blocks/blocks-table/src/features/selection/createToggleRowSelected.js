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

// TanStack's row toggle never clears other rows, so radio (single) selection replaces the record.
function createToggleRowSelected(api) {
  return function toggleRowSelected({ id }) {
    if (!api.config.rowSelection) return false;
    const row = api.table.getRow(id, true);
    if (!row) return false;
    if (api.config.rowSelection.type === 'radio') {
      const selected = api.state.rowSelection[id] === true;
      api.updateSlice('rowSelection', () => (selected ? {} : { [id]: true }), { cause: 'select' });
      return true;
    }
    row.toggleSelected();
    return true;
  };
}

export default createToggleRowSelected;
