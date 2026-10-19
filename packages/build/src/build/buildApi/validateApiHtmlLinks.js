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

import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import collectHtmlPageIds from '../../utils/collectHtmlPageIds.js';

// Endpoints build most server-side HTML (event and audit messages), so their
// data-page-id links are checked against the app's pages too. Runs before
// buildJs replaces _js bodies with hashes.
function validateApiHtmlLinks({ components, context }) {
  const linkActionRefs = [];
  (components.api ?? []).forEach((endpoint) => {
    collectHtmlPageIds({ json: JSON.stringify(endpoint) }).forEach((pageId) => {
      linkActionRefs.push({
        configKey: endpoint['~k'],
        html: true,
        location: `endpoint "${endpoint.endpointId}"`,
        pageId,
      });
    });
  });
  validateLinkReferences({
    linkActionRefs,
    pageIds: (components.pages ?? []).map((page) => page.pageId),
    context,
  });
  return components;
}

export default validateApiHtmlLinks;
