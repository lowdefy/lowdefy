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
import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';
import buildPage from '../buildPages/buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import validateCallApiRefs from '../buildPages/validateCallApiRefs.js';
import validateDynamicBlockRefs from '../buildPages/validateDynamicBlockRefs.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import validateWebsocketRefs from '../buildPages/validateWebsocketRefs.js';

function buildTargetPages({ pages, target, failedPages, context, checkDuplicatePageId }) {
  // Wrap each page build to collect errors instead of stopping on first error
  pages.forEach((page, index) => {
    try {
      const result = buildPage({ page, index, context, checkDuplicatePageId, target });
      // buildPage returns { failed: true } when validation fails
      if (result?.failed) {
        failedPages.add(page);
      }
    } catch (error) {
      // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
      if (
        error instanceof ConfigError &&
        shouldSuppressBuildCheck(error, context.keyMap)
      ) {
        return;
      }
      // Collect error object if context.errors exists, otherwise throw (for backward compat with tests)
      if (context?.errors) {
        context.errors.push(error);
        failedPages.add(page);
      } else {
        throw error;
      }
    }
  });
}

function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const mobilePages = type.isArray(components.mobile?.pages) ? components.mobile.pages : [];
  // One duplicate-pageId check across both targets — pageIds share a global
  // namespace (requests, auth rules, and /api/page/* are keyed by pageId).
  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
  });

  // Initialize action ref collections across all pages
  context.linkActionRefs = [];
  context.callApiActionRefs = [];
  context.websocketActionRefs = [];
  context.dynamicBlockRefs = [];

  // Track which pages failed to build so we skip them in validation
  const failedPages = new Set();

  buildTargetPages({ pages, target: 'web', failedPages, context, checkDuplicatePageId });
  buildTargetPages({
    pages: mobilePages,
    target: 'mobile',
    failedPages,
    context,
    checkDuplicatePageId,
  });

  // Validate that all Link actions reference existing pages
  // Include all pages — a link to a broken page is valid; the page error is already reported.
  // Cross-target links are valid; the client checks the fetched config's target at runtime.
  const pageIds = [...pages, ...mobilePages].map((page) => page.pageId);
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
  [...pages, ...mobilePages].forEach((page) => {
    if (failedPages.has(page)) return;
    validateStateReferences({ page, context });
    validatePayloadReferences({ page, context });
    validateServerStateReferences({ page, context });
  });

  return components;
}

export default buildPages;
