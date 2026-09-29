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

import { tableMemo } from '@tanstack/react-table';

import filterRowModel from './filterRowModel.js';

// TanStack's `filteredRowModel` slot, the first stage after the core rows (filter, then sort).
// It recomputes only when the rows, the filter or the search change (and, while searching, the
// visible columns), so an unchanged filter never re-runs.
function createConditionFilteredRowModel() {
  return function getFilteredRowModel(table) {
    return tableMemo({
      feature: 'columnFilteringFeature',
      table,
      fnName: 'table.getFilteredRowModel',
      memoDeps: () => {
        const { filter, search } = table.options.state;
        return [
          table.getPreFilteredRowModel(),
          filter,
          search,
          search ? table.atoms.columnVisibility.get() : null,
          table.options.lowdefyFiltering,
        ];
      },
      fn: () => filterRowModel(table),
    });
  };
}

export default createConditionFilteredRowModel;
