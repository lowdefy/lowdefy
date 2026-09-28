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

import clipboardFeature from './clipboard/clipboardFeature.js';
import editingFeature from './editing/editingFeature.js';
import eventsFeature from './events/eventsFeature.js';
import exportFeature from './export/exportFeature.js';
import groupingFeature from './grouping/groupingFeature.js';
import keyboardFeature from './keyboard/keyboardFeature.js';
import orderingFeature from './ordering/orderingFeature.js';
import pinningFeature from './pinning/pinningFeature.js';
import selectionFeature from './selection/selectionFeature.js';
import sizingFeature from './sizing/sizingFeature.js';
import sortingFeature from './sorting/sortingFeature.js';
import virtualizationFeature from './virtualization/virtualizationFeature.js';
import visibilityFeature from './visibility/visibilityFeature.js';

// The table's feature modules, in composition order. The core loops over this list for TanStack
// feature slots, state slices, view/value derivation, header parts, delegated event handlers,
// actions and block methods (see ARCHITECTURE.md). The order is the order handlers run in: a
// handler that returns true stops the chain for that event.
const features = [
  sortingFeature,
  sizingFeature,
  orderingFeature,
  pinningFeature,
  visibilityFeature,
  editingFeature,
  clipboardFeature,
  selectionFeature,
  virtualizationFeature,
  groupingFeature,
  keyboardFeature,
  eventsFeature,
  exportFeature,
];

export default features;
