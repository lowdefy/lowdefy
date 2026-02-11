/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ConfigError } from '@lowdefy/errors/build';
import buildPage from '../buildPages/buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';

function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
    context,
  });

  // Initialize linkActionRefs to collect Link action references across all pages
  context.linkActionRefs = [];

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
      // Skip suppressed ConfigErrors (via ~ignoreBuildChecks: true)
      if (error instanceof ConfigError && error.suppressed) {
        return;
      }
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
  // Only include pages that built successfully
  const pageIds = pages
    .filter((_, index) => !failedPageIndices.has(index))
    .map((page) => page.pageId);
  validateLinkReferences({
    linkActionRefs: context.linkActionRefs,
    pageIds,
    context,
  });

  // Validate that _state references use defined block IDs
  // and _payload references use defined payload keys
  // Skip pages that failed to build
  pages.forEach((page, index) => {
    if (failedPageIndices.has(index)) return;
    validateStateReferences({ page, context });
    validatePayloadReferences({ page, context });
    validateServerStateReferences({ page, context });
  });

  return components;
}

export default buildPages;
