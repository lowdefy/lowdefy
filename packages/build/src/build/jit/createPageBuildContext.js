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

import cloneWithMarkers from '../buildRefs/cloneWithMarkers.js';
import createBuildHandleError from '../../utils/createBuildHandleError.js';
import createHandleWarning from '../../utils/createHandleWarning.js';
import createTypeCounters from '../../utils/createTypeCounters.js';

// The context one JIT page build runs on: the kept context's fields, its maps
// and sets shared by reference, with the fields in pageBuildOwnedFields fresh
// or copied.
// The dev server keeps one context across page builds and edits, so a build
// must not leave its errors, warnings, type counts or action references where
// another page's build would read them.
// Module var values and single-value deferred records are cached as they are
// resolved. On the kept context the first page build to resolve one would read
// its files and every later build would take the cached value, so only the
// first page would record those files as inputs and be rebuilt when they
// change. Each page build resolves them on its own copies instead, starting
// from what the skeleton build cached (whose files are skeleton sources).
function copyModules(modules) {
  const copies = Object.create(null);
  for (const [entryId, moduleEntry] of Object.entries(modules ?? {})) {
    copies[entryId] = {
      ...moduleEntry,
      // Forced placeholders are spliced into consumerVars in place.
      consumerVars: cloneWithMarkers(moduleEntry.consumerVars),
      resolvedVarCache: { ...moduleEntry.resolvedVarCache },
    };
  }
  return copies;
}

function copyDeferredRecords(deferred) {
  const copies = {};
  for (const [id, record] of Object.entries(deferred ?? {})) {
    copies[id] = {
      ...record,
      promise: null,
      waitingOn: new Set(),
      done: false,
      value: undefined,
    };
  }
  return copies;
}

function createPageBuildContext(keptContext) {
  const pageBuildContext = {
    ...keptContext,
    errors: [],
    warnings: [],
    typeCounters: createTypeCounters(),
    pageTypeCounters: new Map(),
    linkActionRefs: [],
    callApiActionRefs: [],
    websocketActionRefs: [],
    dynamicBlockRefs: [],
    orgClientActionRefs: [],
    modules: copyModules(keptContext.modules),
    deferred: copyDeferredRecords(keptContext.deferred),
  };
  pageBuildContext.handleError = createBuildHandleError({ context: pageBuildContext });
  pageBuildContext.handleWarning = createHandleWarning({ context: pageBuildContext });
  return pageBuildContext;
}

export default createPageBuildContext;
