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

import { columnVisibilityFeature } from '@tanstack/react-table';

import handleColumnGroupToggle from './handleColumnGroupToggle.js';
import initCollapsedColumnGroups from './initCollapsedColumnGroups.js';
import initColumnVisibility from './initColumnVisibility.js';
import visibilityToValue from './visibilityToValue.js';
import visibilityToViewColumn from './visibilityToViewColumn.js';

// Which columns show. `columnVisibility` is the view's (what the user hid, `view.columns[].hidden`);
// `collapsedColumnGroups` is the collapsible column groups that are collapsed
// (`view.collapsedColumnGroups`). TanStack sees both combined (core/getDisplayedVisibility.js,
// `api.displayedVisibility`), so a column a collapsed group hides is never saved as hidden.
const visibilityFeature = {
  name: 'visibility',
  tableFeatures: { columnVisibilityFeature },
  viewKeys: ['collapsedColumnGroups'],
  slices: {
    columnVisibility: { init: initColumnVisibility, cause: 'columns' },
    collapsedColumnGroups: { init: initCollapsedColumnGroups, cause: 'columns' },
  },
  toViewColumn: visibilityToViewColumn,
  toValue: visibilityToValue,
  gridHandlers: { click: handleColumnGroupToggle },
};

export default visibilityFeature;
