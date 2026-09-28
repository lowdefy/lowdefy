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

import createCollapseAllGroups from './createCollapseAllGroups.js';
import createExpandAllGroups from './createExpandAllGroups.js';
import createSetCollapsedGroups from './createSetCollapsedGroups.js';
import createSetGroup from './createSetGroup.js';
import createSetGroupKeys from './createSetGroupKeys.js';
import createToggleGroup from './createToggleGroup.js';
import createToggleGroupSelected from './createToggleGroupSelected.js';
import groupingHeaderMenuItems from './groupingHeaderMenuItems.js';
import groupingToValue from './groupingToValue.js';
import GroupRow from './GroupRow.js';
import handleGroupClick from './handleGroupClick.js';
import handleGroupKeyDown from './handleGroupKeyDown.js';
import initAggregates from './initAggregates.js';
import initCollapsedGroups from './initCollapsedGroups.js';
import initGrouping from './initGrouping.js';
import StickyGroupRow from './StickyGroupRow.js';
import useGrouping from './useGrouping.js';

// Client-side row grouping (D6, D10.8): `view.group` levels over groupable columns, collapsed
// groups and group aggregates. The rows it produces are one flat list of group header items and
// leaf rows; the Body renders the headers with `rowRenderers.group`, and one sticky overlay shows
// the current group while scrolling.
const groupingFeature = {
  name: 'grouping',
  viewKeys: ['group', 'collapsedGroups', 'aggregates'],
  slices: {
    // Regrouping 100k rows is one tree build; in a transition the old rows stay (dimmed) until
    // the grouped ones land, as with a sort.
    grouping: { init: initGrouping, cause: 'group', transition: true },
    collapsedGroups: { init: initCollapsedGroups, cause: 'expand' },
    aggregates: { init: initAggregates, cause: 'aggregate' },
  },
  toValue: groupingToValue,
  actions: {
    setCollapsedGroups: createSetCollapsedGroups,
    setGroupKeys: createSetGroupKeys,
    toggleGroup: createToggleGroup,
    toggleGroupSelected: createToggleGroupSelected,
  },
  methods: {
    collapseAllGroups: createCollapseAllGroups,
    expandAllGroups: createExpandAllGroups,
    setGroup: createSetGroup,
  },
  gridHandlers: { click: handleGroupClick, keydown: handleGroupKeyDown },
  headerMenuItems: groupingHeaderMenuItems,
  rowRenderers: { group: GroupRow },
  bodyOverlay: StickyGroupRow,
  useFeature: useGrouping,
};

export default groupingFeature;
