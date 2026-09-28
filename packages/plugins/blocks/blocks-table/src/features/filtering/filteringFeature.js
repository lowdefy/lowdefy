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

// Placeholder: replaced by feat/v7-table-chrome on merge.

import createOpenColumnFilter from './createOpenColumnFilter.js';
import createSetSearch from './createSetSearch.js';
import filteringToValue from './filteringToValue.js';
import initFilter from './initFilter.js';
import initSearch from './initSearch.js';
import useColumnFilterState from './useColumnFilterState.js';

// State only: `view.filter` and `view.search` slices, no row filtering.
const filteringFeature = {
  name: 'filtering',
  viewKeys: ['filter', 'search'],
  slices: {
    filter: { init: initFilter, cause: 'filter' },
    search: { init: initSearch, cause: 'search' },
  },
  toValue: filteringToValue,
  actions: {
    openColumnFilter: createOpenColumnFilter,
    setSearch: createSetSearch,
  },
  useFeature: useColumnFilterState,
};

export default filteringFeature;
