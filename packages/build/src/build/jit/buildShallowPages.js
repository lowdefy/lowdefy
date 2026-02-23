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

import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';
import buildPage from '../buildPages/buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createPageRegistry from './createPageRegistry.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';

function buildShallowPages({ components, shallowPageIndices, context }) {
  // Set pageId on all pages (normally done by buildPage in buildPages).
  // Must run before createPageRegistry which uses page.id as map key.
  for (const page of components.pages ?? []) {
    if (page.id && !page.pageId) {
      page.pageId = page.id;
    }
  }

  // Extract page registry BEFORE buildPage (which transforms page.id to `page:${pageId}`).
  // Registry uses original page.id as the map key.
  const pageRegistry = createPageRegistry({ components, shallowPageIndices, context });

  // Build non-shallow pages (fully resolved, including injected defaults like 404).
  // Shallow pages are deferred to JIT resolution.
  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
  });
  context.linkActionRefs = [];

  (components.pages ?? []).forEach((page, index) => {
    checkDuplicatePageId({ id: page.id, configKey: page['~k'] });
    if (page['~shallow']) return;
    try {
      // Pass no-op for checkDuplicatePageId since we already checked above
      buildPage({ page, index, context, checkDuplicatePageId: () => {} });
    } catch (error) {
      // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
      if (
        error instanceof ConfigError &&
        shouldSuppressBuildCheck(error, context.keyMap)
      ) {
        return;
      }
      context.errors.push(error);
    }
  });

  // Validate references for non-shallow pages
  validateLinkReferences({
    linkActionRefs: context.linkActionRefs,
    pageIds: (components.pages ?? []).map((p) => p.pageId),
    context,
  });
  for (const page of components.pages ?? []) {
    if (page['~shallow']) continue;
    validateStateReferences({ page, context });
    validatePayloadReferences({ page, context });
    validateServerStateReferences({ page, context });
  }

  return pageRegistry;
}

export default buildShallowPages;
