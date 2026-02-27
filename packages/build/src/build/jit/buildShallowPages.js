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

import { serializer } from '@lowdefy/helpers';

import buildPage from '../buildPages/buildPage.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createPageRegistry from './createPageRegistry.js';
import PAGE_CONTENT_KEYS from './pageContentKeys.js';

function buildShallowPages({ components, context }) {
  // Set pageId on all pages (normally done by buildPage in buildPages).
  // Must run before createPageRegistry which uses page.id as map key.
  for (const page of components.pages ?? []) {
    if (page.id && !page.pageId) {
      page.pageId = page.id;
    }
  }

  const pageRegistry = createPageRegistry({ components, context });

  const checkDuplicatePageId = createCheckDuplicateId({
    message: 'Duplicate pageId "{{ id }}".',
  });
  for (const page of components.pages ?? []) {
    checkDuplicatePageId({ id: page.id, configKey: page['~k'] });
  }

  // Build sourceless pages (e.g., default 404) — no YAML to JIT-resolve from.
  context.linkActionRefs = [];
  const sourcelessPageArtifacts = [];

  (components.pages ?? []).forEach((page, index) => {
    const entry = pageRegistry.get(page.id);
    if (!entry || entry.refPath !== null) return;

    buildPage({ page, index, context });

    const pageRequests = [...(page.requests ?? [])];
    delete page.requests;
    const cleanPage = jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
    const cleanRequests = jsMapParser({
      input: pageRequests,
      jsMap: context.jsMap,
      env: 'server',
    });
    const builtPage = { ...cleanPage, requests: cleanRequests };

    sourcelessPageArtifacts.push({
      pageId: builtPage.pageId,
      pageJson: serializer.serializeToString(builtPage),
      requests: (builtPage.requests ?? []).map((req) => ({
        requestId: req.requestId,
        requestJson: serializer.serializeToString(req),
      })),
    });

    // Strip content for subsequent skeleton steps
    for (const key of PAGE_CONTENT_KEYS) {
      delete page[key];
    }
  });

  return { pageRegistry, sourcelessPageArtifacts };
}

export default buildShallowPages;
