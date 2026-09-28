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

import { useMemo } from 'react';
import { type } from '@lowdefy/helpers';
import computeAggregate from '@lowdefy/blocks-antd/table/computeAggregate.js';
import getAggregateText from '@lowdefy/blocks-antd/table/getAggregateText.js';

import createAccessor from './createAccessor.js';

// The summary footer's values: every column that declares an `aggregate`, computed over all the
// table's rows (not a page, not the rendered window) with the shared column core, as TableLight
// does. Keyed on the unsorted row model, so a sort never recomputes them. Null when there is
// nothing to show (`summary: false`, or no column declares an aggregate).
function useSummary({ config, table }) {
  const rows = table.getPreSortedRowModel().rows;
  return useMemo(() => {
    if (!config.summary) return null;
    const byKey = new Map();
    config.columns.forEach((column) => {
      if (type.isNone(column.aggregate)) return;
      const accessor = createAccessor(column.field);
      const values = new Array(rows.length);
      for (let i = 0; i < rows.length; i++) values[i] = accessor(rows[i].original);
      const value = computeAggregate({ fn: column.aggregate, values, column });
      byKey.set(column.key, {
        fn: column.aggregate,
        text: getAggregateText({ fn: column.aggregate, value, column }),
      });
    });
    return byKey.size > 0 ? byKey : null;
  }, [config, rows]);
}

export default useSummary;
