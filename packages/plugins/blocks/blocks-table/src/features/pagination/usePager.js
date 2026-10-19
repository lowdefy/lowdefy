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

import React from 'react';

import TablePagination from './TablePagination.js';

// The pager below the grid for the page usePagination picked in this render.
function usePager({ api }) {
  if (!api.page) return null;
  const { current, onChange, pageSize, total } = api.page;
  return {
    regions: {
      bottom: (
        <TablePagination current={current} onChange={onChange} pageSize={pageSize} total={total} />
      ),
    },
  };
}

export default usePager;
