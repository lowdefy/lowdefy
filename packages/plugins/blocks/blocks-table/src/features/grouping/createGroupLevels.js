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

import createComparator from '@lowdefy/blocks-antd/table/createComparator.js';
import getCellRenderer from '@lowdefy/blocks-antd/table/getCellRenderer.js';

// One entry per group level with what the tree build and the header rows need: the column's
// compiled accessor, the shared core's value comparator and cell renderer, its options (already
// normalised by the shared normalizeColumns), and how its groups are ordered ('sort' when the
// view sorts on the column, 'options' for enum columns, else 'appearance').
function createGroupLevels({ keys, table, sorting }) {
  return keys.map((key) => {
    const { accessor, column } = table.getColumn(key).columnDef.meta;
    const sort = sorting.find((entry) => entry.id === key);
    const { options } = column;
    let order = 'appearance';
    if (sort) {
      order = 'sort';
    } else if (options?.length > 0) {
      order = 'options';
    }
    return {
      key,
      accessor,
      column,
      compare: createComparator({ column }),
      desc: sort?.desc === true,
      options,
      order,
      Renderer: getCellRenderer(column.type),
    };
  });
}

export default createGroupLevels;
