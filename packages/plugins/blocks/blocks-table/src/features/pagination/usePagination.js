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

import { useMemo, useState } from 'react';

import isDataItem from '../../core/isDataItem.js';

// The pagination feature's display-list hook, last in the registry: one page of the display list
// (rows, or group headers and rows when grouped). The page is local UI state (not part of the
// value); it is clamped when the list shrinks under it, and changing page scrolls the grid back
// to the top. `api.page` is what the pager (usePager) renders. `dataRows` keeps every page for
// export and the summary.
function usePagination({ api, config, rows, state }) {
  const [page, setPage] = useState(1);
  const pageSize = state.pageSize;
  const total = rows.length;
  const pageCount = config.pagination ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const end = Math.min(total, current * pageSize);
  const pageRows = useMemo(
    () => (config.pagination ? rows.slice(start, end) : null),
    [config.pagination, rows, start, end]
  );
  const dataRows = useMemo(
    () => (config.pagination ? rows.filter(isDataItem) : null),
    [config.pagination, rows]
  );
  if (!config.pagination) {
    api.page = null;
    return null;
  }
  api.page = {
    current,
    pageSize,
    total,
    onChange(next) {
      setPage(next);
      if (api.scrollerRef.current) api.scrollerRef.current.scrollTop = 0;
    },
  };
  return { rows: pageRows, dataRows };
}

export default usePagination;
