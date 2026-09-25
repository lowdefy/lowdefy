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

import { type } from '@lowdefy/helpers';

import validateCallApiRefs from './validateCallApiRefs.js';
import validateDynamicBlockRefs from './validateDynamicBlockRefs.js';
import validateLinkReferences from './validateLinkReferences.js';
import validateOrgClientActionRefs from './validateOrgClientActionRefs.js';
import validatePayloadReferences from './validatePayloadReferences.js';
import validateServerStateReferences from './validateServerStateReferences.js';
import validateStateReferences from './validateStateReferences.js';
import validateWebsocketRefs from './validateWebsocketRefs.js';

// Cross-reference checks over pages built with buildPage. The full build runs
// them over every page; the dev skeleton build runs them over the pages it
// builds itself (pages written inline in lowdefy.yaml), so dev reports the
// same warnings for those pages as the full build. The action ref collections
// on context are filled by buildPage.
function validatePageReferences({ components, pages, pageIds, context }) {
  // A link to a page that failed to build is still valid - the page error is
  // already reported - so pageIds holds every page in the app.
  validateLinkReferences({
    linkActionRefs: context.linkActionRefs,
    pageIds,
    context,
  });

  // CallAPI actions must not target InternalApi endpoints.
  const endpointConfigs = type.isArray(components.api) ? components.api : [];
  validateCallApiRefs({
    callApiActionRefs: context.callApiActionRefs,
    endpointConfigs,
    context,
  });

  // Fail the build when a per-org client action is wired under the "pinned"
  // organizations policy (the endpoints are disabled there).
  validateOrgClientActionRefs({
    orgClientActionRefs: context.orgClientActionRefs,
    policy: components.auth?.organizations?.policy ?? 'pinned',
    context,
  });

  validateDynamicBlockRefs({
    dynamicBlockRefs: context.dynamicBlockRefs,
    endpointConfigs,
    context,
  });

  validateWebsocketRefs({
    websocketActionRefs: context.websocketActionRefs,
    websocketIds: context.websocketIds ?? new Set(),
    context,
  });

  pages.forEach((page) => {
    validateStateReferences({ page, context });
    validatePayloadReferences({ page, context });
    validateServerStateReferences({ page, context });
  });
}

export default validatePageReferences;
