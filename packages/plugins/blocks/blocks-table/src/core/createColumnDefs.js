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

import createAccessor from './createAccessor.js';
import createComparator from './createComparator.js';
import getCellRenderer from './getCellRenderer.js';

const DEFAULT_WIDTH = 160;
const MIN_WIDTH = 48;
const MAX_WIDTH = 2000;

// Compiled once per column config change, with stable accessor, comparator and renderer
// identities (D10.5): cells and sort keys never rebuild them per row.
function createColumnDefs({ columns }) {
  return columns.map((column) => ({
    id: column.key,
    accessorFn: createAccessor(column.field),
    header: column.title,
    size: column.width ?? DEFAULT_WIDTH,
    minSize: column.minWidth ?? MIN_WIDTH,
    maxSize: column.maxWidth ?? MAX_WIDTH,
    enableSorting: column.sortable,
    sortDescFirst: false,
    meta: {
      column,
      accessor: createAccessor(column.field),
      comparator: createComparator({ column }),
      Renderer: getCellRenderer(column.type),
    },
  }));
}

export default createColumnDefs;
