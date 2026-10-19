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

import createApplyFiltering from './createApplyFiltering.js';
import createClearFilters from './createClearFilters.js';
import createCloseColumnFilter from './createCloseColumnFilter.js';
import createConditionFilteredRowModel from './createConditionFilteredRowModel.js';
import createOpenColumnFilter from './createOpenColumnFilter.js';
import createSetFilter from './createSetFilter.js';
import createSetSearch from './createSetSearch.js';
import createUpdateColumnFilter from './createUpdateColumnFilter.js';
import FilterIndicator from './FilterIndicator.js';
import filteringToValue from './filteringToValue.js';
import getFilteringHeaderProps from './getFilteringHeaderProps.js';
import getFilteringMenuItems from './getFilteringMenuItems.js';
import getFilteringTableOptions from './getFilteringTableOptions.js';
import handleFilterIndicatorClick from './handleFilterIndicatorClick.js';
import initFilter from './initFilter.js';
import initSearch from './initSearch.js';
import useFilteringState from './useFilteringState.js';

import './filtering.css';

// `view.filter` (a Condition) and `view.search` (text), applied client-side before sorting
// (D6, D10.7). Writes go through applyFiltering: the rows are tested in time slices, then the
// state applies in a transition, so the edit paints at once and the previous rows stay, dimmed,
// until the filtered rows land. In server mode the state only feeds the request.
const filteringFeature = {
  name: 'filtering',
  tableFeatures: { filteredRowModel: createConditionFilteredRowModel() },
  viewKeys: ['filter', 'search'],
  slices: {
    filter: { init: initFilter, cause: 'filter', transition: true },
    search: { init: initSearch, cause: 'search', transition: true },
  },
  tableOptions: getFilteringTableOptions,
  toValue: filteringToValue,
  actions: {
    applyFiltering: createApplyFiltering,
    openColumnFilter: createOpenColumnFilter,
    closeColumnFilter: createCloseColumnFilter,
    updateColumnFilter: createUpdateColumnFilter,
    setSearch: createSetSearch,
  },
  methods: {
    setFilter: createSetFilter,
    clearFilters: createClearFilters,
    setSearch: createSetSearch,
  },
  headerParts: [FilterIndicator],
  headerCellProps: getFilteringHeaderProps,
  headerMenuItems: getFilteringMenuItems,
  gridHandlers: { click: handleFilterIndicatorClick },
  useFeature: useFilteringState,
};

export default filteringFeature;
