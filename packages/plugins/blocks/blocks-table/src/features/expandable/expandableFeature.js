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

import DetailRow from './DetailRow.js';
import ExpandToggle from './ExpandToggle.js';
import handleExpandClick from './handleExpandClick.js';
import useExpandableItems from './useExpandableItems.js';

import './expandable.css';

// `expandable: { template, rowExpandable: { when } }`: a chevron in the first data column opens
// a detail row below the row with the template's HTML. Expanded row keys are the value's
// `expanded` (shared with tree rows). Lowdefy blocks inside detail rows are not supported yet.
const expandableFeature = {
  name: 'expandable',
  useItems: useExpandableItems,
  rowRenderers: { detail: DetailRow },
  cellLead: ExpandToggle,
  gridHandlers: { click: handleExpandClick },
};

export default expandableFeature;
