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

// Action and block method `selectAllMatching()`: selects every row the view matches as
// `{ all: true, except: [] }`, never a list of every key (D7). In client mode the matching rows
// are the view's data rows; rows loaded later are selected too while the selection stays "all".
function createSelectAllMatching(api) {
  return function selectAllMatching() {
    if (api.config.rowSelection?.type !== 'checkbox') return false;
    const selection = {};
    api.dataRows.forEach((row) => {
      selection[row.id] = true;
    });
    api.updateSlice('selectionMode', () => 'all', { cause: 'select' });
    api.updateSlice('rowSelection', () => selection, { cause: 'select' });
    return true;
  };
}

export default createSelectAllMatching;
