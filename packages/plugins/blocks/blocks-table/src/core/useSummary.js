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
import computeAggregate from '@lowdefy/blocks-antd/table/computeAggregate.js';
import getAggregateText from '@lowdefy/blocks-antd/table/getAggregateText.js';

import createColumnAccessor from './createColumnAccessor.js';
import resolveAggregates from '../features/grouping/resolveAggregates.js';

function computeClientValue({ column, fn, rows }) {
  const accessor = createColumnAccessor(column);
  const values = new Array(rows.length);
  for (let i = 0; i < rows.length; i++) values[i] = accessor(rows[i].original);
  return computeAggregate({ fn, values, column });
}

// The summary footer's values: the aggregates in effect (the view's `aggregates` over each
// column's `aggregate` default, the same ones the group headers show), over all the table's
// filtered rows (not a page, not the rendered window) with the shared column core, as TableLight
// does. Keyed on the unsorted row model, so a sort never recomputes them. In server mode the
// browser holds only some rows, so the values are the root list's `aggregates` from the
// server's responses. Null when there is nothing to show (`summary: false`, or no aggregates).
function useSummary({ api, config, state, table }) {
  const rows = table.getPreSortedRowModel().rows;
  const store = api.serverStore;
  const serverAggregates = store ? store.getAggregates() : null;
  return useMemo(() => {
    if (!config.summary) return null;
    const resolved = resolveAggregates({ columns: config.columns, aggregates: state.aggregates });
    if (resolved.length === 0) return null;
    const byKey = new Map();
    resolved.forEach(({ key, fn }) => {
      const column = config.columnsByKey.get(key);
      const value = store
        ? serverAggregates?.[key] ?? null
        : computeClientValue({ column, fn, rows });
      byKey.set(key, { fn, text: getAggregateText({ fn, value, column }) });
    });
    return byKey;
  }, [config, rows, state.aggregates, store, serverAggregates]);
}

export default useSummary;
