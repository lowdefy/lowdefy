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

function SortIndicator({ col, state }) {
  if (!col.column?.sortable) return null;
  const index = state.sorting.findIndex((sort) => sort.id === col.key);
  const sort = state.sorting[index];
  return (
    <span className="lf-table-sort" aria-hidden="true">
      <svg viewBox="0 0 8 12">
        <path
          d="M4 0 8 5H0z"
          data-active={sort && !sort.desc ? '' : undefined}
          fill="currentColor"
        />
        <path d="M4 12 0 7h8z" data-active={sort?.desc ? '' : undefined} fill="currentColor" />
      </svg>
      {sort && state.sorting.length > 1 ? (
        <span className="lf-table-sort-order">{index + 1}</span>
      ) : null}
    </span>
  );
}

export default SortIndicator;
