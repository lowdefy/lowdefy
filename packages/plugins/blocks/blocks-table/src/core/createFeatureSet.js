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

import collectBodyOverlays from './collectBodyOverlays.js';
import collectBulkItems from './collectBulkItems.js';
import collectCellLeads from './collectCellLeads.js';
import collectCellRenderers from './collectCellRenderers.js';
import collectClaimedViewKeys from './collectClaimedViewKeys.js';
import collectGridHandlers from './collectGridHandlers.js';
import collectHeaderParts from './collectHeaderParts.js';
import collectRowRenderers from './collectRowRenderers.js';
import collectSliceDefinitions from './collectSliceDefinitions.js';
import collectToolbarItems from './collectToolbarItems.js';
import createTanstackFeatures from './createTanstackFeatures.js';

// A table's feature modules, in composition order, with what the core reads from them collected
// once: `api.features`. Built once per distinct list, so every table with the same features
// shares one set (and one stable TanStack feature set).
function createFeatureSet(list) {
  return {
    bodyOverlays: collectBodyOverlays(list),
    bulkItems: collectBulkItems(list),
    cellLeads: collectCellLeads(list),
    cellRenderers: collectCellRenderers(list),
    claimedViewKeys: collectClaimedViewKeys(list),
    gridHandlers: collectGridHandlers(list),
    headerParts: collectHeaderParts(list),
    list,
    rowRenderers: collectRowRenderers(list),
    sliceDefinitions: collectSliceDefinitions(list),
    tanstackFeatures: createTanstackFeatures(list),
    toolbarItems: collectToolbarItems(list),
  };
}

export default createFeatureSet;
