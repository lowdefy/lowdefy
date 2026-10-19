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

import sortRowModel from './sortRowModel.js';

// Drop-in replacement for TanStack's createSortedRowModel(): same slot, same memo inputs, a typed
// index sort underneath. Nested sub-rows are not sorted yet; tree data arrives with its module.
function createIndexSortedRowModel() {
  return function getSortedRowModel(table) {
    return tableMemo({
      feature: 'rowSortingFeature',
      table,
      fnName: 'table.getSortedRowModel',
      memoDeps: () => [table.atoms.sorting?.get(), table.getPreSortedRowModel()],
      fn: () => sortRowModel(table),
    });
  };
}

export default createIndexSortedRowModel;
