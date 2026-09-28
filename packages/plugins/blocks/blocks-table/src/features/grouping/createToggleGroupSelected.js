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

import countGroupSelection from './countGroupSelection.js';

// The group checkbox selects every leaf row of the group, or clears them when all are selected.
function createToggleGroupSelected(api) {
  return function toggleGroupSelected({ key }) {
    if (api.config.rowSelection?.type !== 'checkbox') return false;
    const group = api.grouping.tree.groupsByKey.get(key);
    const { leaves } = api.grouping.tree;
    const { selected, total } = countGroupSelection({
      leaves,
      start: group.start,
      end: group.end,
      selection: api.state.rowSelection,
    });
    const select = selected < total;
    api.updateSlice(
      'rowSelection',
      (previous) => {
        const next = { ...previous };
        for (let i = group.start; i < group.end; i++) {
          if (select) {
            next[leaves[i].id] = true;
          } else {
            delete next[leaves[i].id];
          }
        }
        return next;
      },
      { cause: 'select' }
    );
    return true;
  };
}

export default createToggleGroupSelected;
