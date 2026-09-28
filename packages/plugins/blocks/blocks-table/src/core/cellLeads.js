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

import features from '../features/index.js';

// Components rendered at the start of a row's first data cell, before its content (the tree
// indent and chevron, the expandable-row chevron), from the features' `cellLead`. Each receives
// `{ api, item }` for wrapped row items and returns null when it has nothing to show.
const cellLeads = features.map((feature) => feature.cellLead).filter(Boolean);

export default cellLeads;
