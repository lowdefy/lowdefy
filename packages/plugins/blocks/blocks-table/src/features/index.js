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
import clipboardFeature from './clipboard/clipboardFeature.js';
import columnManagerFeature from './columnManager/columnManagerFeature.js';
import densityFeature from './density/densityFeature.js';
import enrichmentFeature from './enrichment/enrichmentFeature.js';
import eventsFeature from './events/eventsFeature.js';
import expansionFeature from './expansion/expansionFeature.js';
import exportFeature from './export/exportFeature.js';
import filteringFeature from './filtering/filteringFeature.js';
import groupingFeature from './grouping/groupingFeature.js';
import headerMenuFeature from './headerMenu/headerMenuFeature.js';
import keyboardFeature from './keyboard/keyboardFeature.js';
import lazyCellsFeature from './lazyCells/lazyCellsFeature.js';
import needsEditing from './editing/needsEditing.js';
import needsExpandable from './expandable/needsExpandable.js';
import needsGroupRows from './grouping/needsGroupRows.js';
import needsServerData from './serverData/needsServerData.js';
import needsToolbar from './toolbar/needsToolbar.js';
import needsTree from './tree/needsTree.js';
import needsViews from './views/needsViews.js';
import newRowsFeature from './enrichment/newRowsFeature.js';
import orderingFeature from './ordering/orderingFeature.js';
import paginationFeature from './pagination/paginationFeature.js';
import pinningFeature from './pinning/pinningFeature.js';
import queueFeature from './queue/queueFeature.js';
import selectionFeature from './selection/selectionFeature.js';
import sizingFeature from './sizing/sizingFeature.js';
import sortingFeature from './sorting/sortingFeature.js';
import transactionsFeature from './transactions/transactionsFeature.js';
import virtualizationFeature from './virtualization/virtualizationFeature.js';
import visibilityFeature from './visibility/visibilityFeature.js';

// Optional features load in their own chunk, only for tables whose config needs them
// (core/useFeatureSet.js); `methods` are the block methods they own, registered as no-ops on
// tables without them so a CallMethod never fails.
function optional({ name, needs, load, methods = [] }) {
  return { load, methods, name, needs, optional: true };
}

// The table's feature modules, in composition order. The core loops over a table's list for
// TanStack feature slots, state slices, view/value derivation, header parts, delegated event
// handlers, actions and block methods (see ARCHITECTURE.md). The order is the order handlers run
// in: a handler that returns true stops the chain for that event. Filtering and the header menu
// come first: the filtered row model feeds sorting, and their header buttons claim clicks and
// pointer presses before sorting and column reordering see them. Views come before the toolbar,
// which renders their tabs, and queue's single-key actions run before keyboard navigation sees
// the key (editing's keys, earlier, win on editable cells). Enrichment comes before sorting: its
// "+" header, run buttons and detail-cell clicks and keys win over sorting, selection, editing,
// keyboard navigation and row events; its optimistic new rows (newRows) come after editing, over
// every other overlay. It is also the order of the data pipeline's hooks (TableRoot): `useData`
// (server rows, tree flattening), `useRows` (transactions, then editing's overlay over them) and
// `useItems` (server items, client groups, tree rows, expandable detail rows, the page).
const features = [
  filteringFeature,
  headerMenuFeature,
  columnManagerFeature,
  enrichmentFeature,
  sortingFeature,
  sizingFeature,
  orderingFeature,
  pinningFeature,
  visibilityFeature,
  densityFeature,
  transactionsFeature,
  optional({
    name: 'editing',
    needs: needsEditing,
    load: () => import('./editing/editingFeature.js'),
  }),
  newRowsFeature,
  clipboardFeature,
  optional({
    name: 'paste',
    needs: ({ input }) => input === true,
    load: () => import('./clipboard/pasteFeature.js'),
  }),
  selectionFeature,
  expansionFeature,
  optional({
    name: 'serverData',
    needs: needsServerData,
    load: () => import('./serverData/serverDataFeature.js'),
    methods: ['refresh'],
  }),
  groupingFeature,
  optional({
    name: 'groupRows',
    needs: needsGroupRows,
    load: () => import('./grouping/groupRowsFeature.js'),
    methods: ['collapseAllGroups', 'expandAllGroups', 'setGroup'],
  }),
  optional({ name: 'tree', needs: needsTree, load: () => import('./tree/treeFeature.js') }),
  optional({
    name: 'expandable',
    needs: needsExpandable,
    load: () => import('./expandable/expandableFeature.js'),
  }),
  virtualizationFeature,
  optional({
    name: 'positionedRows',
    needs: ({ rowWindowStrategy }) => rowWindowStrategy === 'positioned',
    load: () => import('./virtualization/positionedRowsFeature.js'),
  }),
  optional({
    name: 'serverRange',
    needs: needsServerData,
    load: () => import('./serverData/serverRangeFeature.js'),
  }),
  lazyCellsFeature,
  optional({ name: 'views', needs: needsViews, load: () => import('./views/viewsFeature.js') }),
  optional({
    name: 'toolbar',
    needs: needsToolbar,
    load: () => import('./toolbar/toolbarFeature.js'),
  }),
  bulkFeature,
  queueFeature,
  keyboardFeature,
  eventsFeature,
  exportFeature,
  paginationFeature,
];

export default features;
