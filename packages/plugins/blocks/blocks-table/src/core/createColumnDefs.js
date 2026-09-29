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

import createSortKeyGetter from '@lowdefy/blocks-antd/table/createSortKeyGetter.js';

import columnSizes from './columnSizes.js';
import createAccessor from './createAccessor.js';

// Compiled once per column config change, with stable accessor and sort key identities (D10.5):
// cells and sort keys never rebuild them per row. `getSortKey` is the shared column core's, so
// the index sort orders rows exactly as the shared comparator (and TableLight) would.
function createColumnDefs({ columns }) {
  return columns.map((column) => ({
    id: column.key,
    accessorFn: createAccessor(column.field),
    header: column.title,
    size: column.width ?? columnSizes.width,
    minSize: column.minWidth ?? columnSizes.minWidth,
    maxSize: column.maxWidth ?? columnSizes.maxWidth,
    enableSorting: column.sortable,
    sortDescFirst: false,
    meta: {
      column,
      accessor: createAccessor(column.field),
      getSortKey: createSortKeyGetter({ column }),
    },
  }));
}

export default createColumnDefs;
