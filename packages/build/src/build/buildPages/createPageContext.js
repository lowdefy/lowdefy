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

import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createCounter from '../../utils/createCounter.js';

// The one place a page context is assembled. buildPage (build time) and
// buildDynamicBlocks (runtime, for Dynamic endpoint content) both build blocks
// through buildBlock, and every buildBlock step that collects references pushes
// into an array on this object. Creating the arrays here means a step added for
// one caller cannot silently crash the other because its array was never created.
//
// Callers pass only what differs: the page, the shared ref arrays a full build
// threads across pages, the type counters, and the runtime-only id prefix and
// request prohibition.
function createPageContext({
  auth,
  blockIdPrefix,
  callApiActionRefs = [],
  context,
  dynamicBlockRefs = [],
  forbidRequests = false,
  linkActionRefs = [],
  pageBlock,
  pageId,
  typeCounters,
  websocketActionRefs = [],
}) {
  return {
    auth,
    blockIdCounter: createCounter(),
    blockIdPrefix,
    callApiActionRefs,
    checkDuplicateRequestId: createCheckDuplicateId({
      message: 'Duplicate requestId "{{ id }}" on page "{{ pageId }}".',
    }),
    context,
    dynamicBlockRefs,
    forbidRequests,
    linkActionRefs,
    // The block that is the page itself, so validation can tell page-level
    // report options from block-level ones. Runtime dynamic content has none.
    pageBlock,
    pageId,
    reportRefs: [],
    requestActionRefs: [],
    requests: [],
    sheetNameRefs: [],
    shortcutRefs: [],
    typeCounters,
    websocketActionRefs,
  };
}

export default createPageContext;
