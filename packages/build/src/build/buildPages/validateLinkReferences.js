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

import { ConfigWarning } from '@lowdefy/errors';

import findSimilarString from '../../utils/findSimilarString.js';

// A data-page-id found by scanning HTML text. The scan cannot tell real markup
// from an HTML example shown in docs or a code sample, so it warns in every
// stage rather than failing a production build.
function warnHtmlLink({ context, pageIdSet, ref }) {
  let message = `data-page-id="${ref.pageId}" in ${ref.location} links to a page that does not exist.`;
  const suggestion = findSimilarString({ input: ref.pageId, candidates: [...pageIdSet] });
  if (suggestion) {
    message += ` Did you mean "${suggestion}"?`;
  }
  context.handleWarning(
    new ConfigWarning(message, { configKey: ref.configKey, checkSlug: 'link-refs' })
  );
}

function validateLinkReferences({ linkActionRefs, pageIds, context }) {
  const pageIdSet = new Set(pageIds);

  linkActionRefs.forEach((ref) => {
    if (ref.html === true) {
      if (!pageIdSet.has(ref.pageId)) {
        warnHtmlLink({ context, pageIdSet, ref });
      }
      return;
    }
    const { pageId, action, sourcePageId } = ref;
    // Only skip validation if skip is explicitly true
    // Pages must exist in app even if Link is conditional
    if (action.skip === true) {
      return;
    }

    if (!pageIdSet.has(pageId)) {
      context.handleWarning(
        new ConfigWarning(
          `Page "${pageId}" not found. Link on page "${sourcePageId}" references non-existent page. ` +
            `Check the pageId for typos, or add a page with id "${pageId}". ` +
            `To link outside the app, use "url" instead of "pageId".`,
          { configKey: action['~k'], prodError: true, checkSlug: 'link-refs' }
        )
      );
    }
  });
}

export default validateLinkReferences;
