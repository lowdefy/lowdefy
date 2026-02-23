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

function validateLinkReferences({ linkActionRefs, pageIds, context }) {
  const pageIdSet = new Set(pageIds);

  linkActionRefs.forEach(({ pageId, action, sourcePageId }) => {
    // Only skip validation if skip is explicitly true
    // Pages must exist in app even if Link is conditional
    if (action.skip === true) {
      return;
    }

    if (!pageIdSet.has(pageId)) {
      context.handleWarning(
        new ConfigWarning(
          `Page "${pageId}" not found. Link on page "${sourcePageId}" references non-existent page.`,
          { configKey: action['~k'], prodError: true, checkSlug: 'link-refs' }
        )
      );
    }
  });
}

export default validateLinkReferences;
