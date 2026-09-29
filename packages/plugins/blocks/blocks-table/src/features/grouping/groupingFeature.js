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

import groupingToValue from './groupingToValue.js';
import initAggregates from './initAggregates.js';
import initCollapsedGroups from './initCollapsedGroups.js';
import initGrouping from './initGrouping.js';

// The grouping state every table keeps, loaded or not with the group rows (groupRowsFeature):
// `view.group` levels, collapsed groups and the view's aggregates (which the summary footer reads
// too). Owning the view keys here keeps the value the same whether or not a table can group.
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
};

export default groupingFeature;
