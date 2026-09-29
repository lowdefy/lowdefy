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

// Action `setSort({ key, desc })`: sorts by one column in the given direction (the header menu's
// Sort ascending / descending), replacing any multi-sort. Keys are prepared first, as for a
// header click.
function createSetSort(api) {
  return function setSort({ key, desc }) {
    const column = api.table.getColumn(key);
    if (!column || !column.getCanSort()) return false;
    const apply = () => api.updateSlice('sorting', () => [{ id: key, desc: desc === true }]);
    // Keys are built for the core rows (sortRowModel reads filtered subsets through them).
    const rows = api.table.getCoreRowModel().rows;
    const root = api.rootRef.current;
    root?.setAttribute('data-pending', '');
    prepareSortKeys({ rows, column }).then(() => {
      root?.removeAttribute('data-pending');
      apply();
    });
    return true;
  };
}

export default createSetSort;
