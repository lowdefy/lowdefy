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

import React, { Suspense } from 'react';

import FilterIcon from './FilterIcon.js';
import getFilteredKeys from './getFilteredKeys.js';
import LazyColumnFilterPopover from './LazyColumnFilterPopover.js';
import PopoverLoading from '../../core/PopoverLoading.js';

// Header part: a filter icon while the column is filtered (click it to edit the filter), and the
// column filter popover while it is open.
function FilterIndicator({ api, col, state }) {
  const filtered = getFilteredKeys(state.filter).has(col.key);
  const open = api.columnFilter.openKey === col.key;
  if (!filtered && !open) return null;
  return (
    <>
      {filtered ? (
        <button
          aria-label="Edit column filter"
          className="lf-table-header-button lf-table-filter-indicator"
          data-lf-filter-indicator=""
          onFocus={LazyColumnFilterPopover.preload}
          onPointerEnter={LazyColumnFilterPopover.preload}
          tabIndex={-1}
          type="button"
        >
          <FilterIcon />
        </button>
      ) : null}
      {open ? (
        <Suspense
          fallback={
            <PopoverLoading
              anchor="header"
              onClose={() => api.actions.closeColumnFilter()}
              placement="bottomLeft"
            />
          }
        >
          <LazyColumnFilterPopover api={api} col={col} />
        </Suspense>
      ) : null}
    </>
  );
}

export default FilterIndicator;
