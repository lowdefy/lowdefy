/* eslint-disable no-param-reassign */

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
import buildPage from '../buildPages/buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import deprecateActionResponseEnvelope from '../buildPages/deprecateActionResponseEnvelope.js';
import validateActionResponsePaths from '../buildPages/validateActionResponsePaths.js';
import validateCallApiRefs from '../buildPages/validateCallApiRefs.js';
import validateDynamicBlockRefs from '../buildPages/validateDynamicBlockRefs.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateOrgClientActionRefs from '../buildPages/validateOrgClientActionRefs.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import validateStateSchema from '../buildPages/validateStateSchema.js';
import validateWebsocketRefs from '../buildPages/validateWebsocketRefs.js';

function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
  });

  // Initialize action ref collections across all pages
  context.linkActionRefs = [];
  context.callApiActionRefs = [];
  context.websocketActionRefs = [];
  context.dynamicBlockRefs = [];
  context.orgClientActionRefs = [];

  // Track which pages failed to build so we skip them in validation
  const failedPageIndices = new Set();

  // Wrap each page build to collect errors instead of stopping on first error
  pages.forEach((page, index) => {
    try {
      const result = buildPage({ page, index, context, checkDuplicatePageId });
      // buildPage returns { failed: true } when validation fails
      if (result?.failed) {
        failedPageIndices.add(index);
      }
    } catch (error) {
      // Every check that carries a checkSlug decides suppression itself, in
      // collectExceptions, and returns - so a throw reaching here is a genuine
      // failure of this page's build, never a suppressed check, and the page is
      // marked failed rather than silently abandoned half-built.
      // Collect error object if context.errors exists, otherwise throw (for backward compat with tests)
      if (context?.errors) {
        context.errors.push(error);
        failedPageIndices.add(index);
      } else {
        throw error;
      }
    }
  });

  // Validate that all Link actions reference existing pages
  // Include all pages — a link to a broken page is valid; the page error is already reported
  const pageIds = pages.map((page) => page.pageId);
  validateLinkReferences({
    linkActionRefs: context.linkActionRefs,
    pageIds,
    context,
  });

  // Validate that CallAPI actions don't target InternalApi endpoints
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

  // Validate that Dynamic blocks reference existing endpoints
  validateDynamicBlockRefs({
    dynamicBlockRefs: context.dynamicBlockRefs,
    endpointConfigs,
    context,
  });

  // Validate that Subscribe/Unsubscribe/Publish actions reference defined websockets
  validateWebsocketRefs({
    websocketActionRefs: context.websocketActionRefs,
    websocketIds: context.websocketIds ?? new Set(),
    context,
  });

  // Validate that _state references use defined block IDs
  // and _payload references use defined payload keys
  // Skip pages that failed to build
  pages.forEach((page, index) => {
    if (failedPageIndices.has(index)) return;
    validateStateReferences({ page, context });
    validateStateSchema({ page, context });
    validatePayloadReferences({ page, context });
    validateServerStateReferences({ page, context });
    deprecateActionResponseEnvelope({ page, context });
    validateActionResponsePaths({ page, endpointConfigs, context });
  });

  return components;
}

export default buildPages;
