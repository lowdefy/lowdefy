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

import React, { useState } from 'react';

import TablePagination from './TablePagination.js';

// Pages of the sorted rows. The page is local UI state (not part of the value); it is clamped
// when the rows shrink under it, and changing page scrolls the grid back to the top.
function usePagination({ api, config, table }) {
  const [page, setPage] = useState(1);
  if (!config.pagination) return null;
  const { pageSize } = config.pagination;
  const total = table.getRowModel().rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  function onChange(next) {
    setPage(next);
    if (api.scrollerRef.current) api.scrollerRef.current.scrollTop = 0;
  }
  return {
    rowRange: { start: (current - 1) * pageSize, end: Math.min(total, current * pageSize) },
    regions: {
      bottom: (
        <TablePagination current={current} onChange={onChange} pageSize={pageSize} total={total} />
      ),
    },
  };
}

export default usePagination;
