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

import collectHtmlPageIds from '../../../utils/collectHtmlPageIds.js';

// HTML anywhere in the block's own config — properties, events, requests, _js
// sources — can link to a page with data-page-id. Child blocks are collected
// when buildBlock visits them.
function collectBlockHtmlLinks(block, { linkActionRefs, pageId }) {
  // eslint-disable-next-line no-unused-vars
  const { areas, blocks, slots, ...ownConfig } = block;
  collectHtmlPageIds({ json: JSON.stringify(ownConfig) }).forEach((linkedPageId) => {
    linkActionRefs.push({
      configKey: block['~k'],
      html: true,
      location: `page "${pageId}"`,
      pageId: linkedPageId,
    });
  });
}

export default collectBlockHtmlLinks;
