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

import { rowSortingFeature } from '@tanstack/react-table';

import createClearSort from './createClearSort.js';
import createIndexSortedRowModel from './createIndexSortedRowModel.js';
import createSetSort from './createSetSort.js';
import createToggleSort from './createToggleSort.js';
import getSortHeaderProps from './getSortHeaderProps.js';
import handleSortClick from './handleSortClick.js';
import initSorting from './initSorting.js';
import SortIndicator from './SortIndicator.js';
import sortingToValue from './sortingToValue.js';

const sortingFeature = {
  name: 'sorting',
  tableFeatures: { rowSortingFeature, sortedRowModel: createIndexSortedRowModel() },
  viewKeys: ['sort'],
  slices: {
    // Applied in a transition: the header click paints at once and the old order stays (dimmed)
    // until the sorted rows land.
    sorting: { init: initSorting, cause: 'sort', transition: true },
  },
  tableOptions: () => ({
    enableMultiSort: true,
    enableSortingRemoval: true,
    isMultiSortEvent: (event) => event.shiftKey === true,
  }),
  toValue: sortingToValue,
  actions: { toggleSort: createToggleSort, setSort: createSetSort, clearSort: createClearSort },
  headerParts: [SortIndicator],
  headerCellProps: getSortHeaderProps,
  gridHandlers: { click: handleSortClick },
};

export default sortingFeature;
