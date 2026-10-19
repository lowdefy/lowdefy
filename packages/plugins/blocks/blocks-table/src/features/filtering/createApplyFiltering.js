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

import getSearchColumns from './getSearchColumns.js';
import isServerMode from './isServerMode.js';
import prepareFilterResult from './prepareFilterResult.js';
import pruneCondition from './pruneCondition.js';

function resolveFilter({ filter, current }) {
  if (filter === undefined) return current;
  if (typeof filter === 'function') return filter(current);
  return filter;
}

// Action `applyFiltering({ filter, search })`, the one write path for `view.filter` and
// `view.search` from inside the table (methods, column filters, the toolbar). `filter` is a
// condition, null, or an updater of the current condition; `search` is text or null; either may
// be left out. The rows are tested first in time slices (prepareFilterResult, the table marked
// pending), then the state applies in a transition and the row model reads the prepared result.
// Edits build on the latest requested filter rather than the committed one, which lags while a
// transition is pending, and only the latest call applies when calls overlap.
function createApplyFiltering(api) {
  let latest = 0;
  return function applyFiltering({ filter, search }) {
    const current = api.filtering.target ?? { filter: api.state.filter, search: api.state.search };
    const next = {
      filter: resolveFilter({ filter, current: current.filter }),
      search: search === undefined ? current.search : search,
    };
    api.filtering.target = next;
    latest += 1;
    const call = latest;
    function apply() {
      const filterChanged = next.filter !== api.state.filter;
      const searchChanged = next.search !== api.state.search;
      if (filterChanged) api.updateSlice('filter', () => next.filter);
      if (searchChanged) api.updateSlice('search', () => next.search);
      // Nothing to commit means nothing will catch up with the request: drop it now.
      if (!filterChanged && !searchChanged) api.filtering.target = null;
    }
    if (isServerMode(api.config)) {
      apply();
      return;
    }
    const root = api.rootRef.current;
    root?.setAttribute('data-pending', '');
    prepareFilterResult({
      rows: api.table.getPreFilteredRowModel().rows,
      condition: pruneCondition(next.filter),
      search: next.search,
      context: api.table.options.lowdefyFiltering,
      searchColumns: getSearchColumns({
        columns: api.config.columns,
        columnVisibility: api.state.columnVisibility,
      }),
    }).then(() => {
      if (call !== latest) return;
      root?.removeAttribute('data-pending');
      apply();
    });
  };
}

export default createApplyFiltering;
