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

import bulkFeature from './bulk/bulkFeature.js';
import columnManagerFeature from './columnManager/columnManagerFeature.js';
import densityFeature from './density/densityFeature.js';
import eventsFeature from './events/eventsFeature.js';
import exportFeature from './export/exportFeature.js';
import filteringFeature from './filtering/filteringFeature.js';
import groupingFeature from './grouping/groupingFeature.js';
import keyboardFeature from './keyboard/keyboardFeature.js';
import orderingFeature from './ordering/orderingFeature.js';
import pinningFeature from './pinning/pinningFeature.js';
import queueFeature from './queue/queueFeature.js';
import selectionFeature from './selection/selectionFeature.js';
import sizingFeature from './sizing/sizingFeature.js';
import sortingFeature from './sorting/sortingFeature.js';
import toolbarFeature from './toolbar/toolbarFeature.js';
import viewsFeature from './views/viewsFeature.js';
import virtualizationFeature from './virtualization/virtualizationFeature.js';
import visibilityFeature from './visibility/visibilityFeature.js';

// The table's feature modules, in composition order. The core loops over this list for TanStack
// feature slots, state slices, view/value derivation, header parts, delegated event handlers,
// actions and block methods (see ARCHITECTURE.md). The order is the order handlers run in: a
// handler that returns true stops the chain for that event. Views come before the toolbar, which
// renders their tabs, and queue's single-key actions run before keyboard navigation sees the key.
const features = [
  filteringFeature,
  columnManagerFeature,
  sortingFeature,
  sizingFeature,
  orderingFeature,
  pinningFeature,
  visibilityFeature,
  densityFeature,
  selectionFeature,
  virtualizationFeature,
  groupingFeature,
  viewsFeature,
  toolbarFeature,
  bulkFeature,
  queueFeature,
  keyboardFeature,
  eventsFeature,
  exportFeature,
];

export default features;
