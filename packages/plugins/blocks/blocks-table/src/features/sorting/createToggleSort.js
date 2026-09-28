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

import prepareSortKeys from './prepareSortKeys.js';

// Header sort. When the next order needs keys this data does not have yet, they are prepared
// first (in slices for big text columns) with the table marked pending, then the sort applies in a
// transition. Removing a sort needs no keys and applies at once.
function createToggleSort(api) {
  return function toggleSort({ key, multi }) {
    const column = api.table.getColumn(key);
    if (!column || !column.getCanSort()) return false;
    const apply = () => column.toggleSorting(undefined, multi === true);
    if (column.getNextSortingOrder() === false) {
      apply();
      return true;
    }
    const rows = api.table.getPreSortedRowModel().rows;
    const root = api.rootRef.current;
    root?.setAttribute('data-pending', '');
    prepareSortKeys({ rows, column }).then(() => {
      root?.removeAttribute('data-pending');
      apply();
    });
    return true;
  };
}

export default createToggleSort;
