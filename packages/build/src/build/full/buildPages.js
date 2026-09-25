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
import validatePageReferences from '../buildPages/validatePageReferences.js';

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
      // Skip suppressed ConfigErrors (via ~ignoreBuildChecks)
      if (error instanceof ConfigError && shouldSuppressBuildCheck(error, context.keyMap)) {
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

  // Pages that failed to build are skipped by the per-page validations.
  validatePageReferences({
    components,
    pages: pages.filter((_, index) => !failedPageIndices.has(index)),
    pageIds: pages.map((page) => page.pageId),
    context,
  });

  return components;
}

export default buildPages;
