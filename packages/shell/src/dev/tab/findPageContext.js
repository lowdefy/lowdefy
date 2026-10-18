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

// `page "ticket"`, or `page "ticket" (tickets/s/1)` for an instance of a page with placeholders,
// whose instance key holds the path its values build. Worded as the browser tab words it. A
// screen's key ends in `@{instanceId}`, its route instance, which is left out.
function describePage({ pageId, instanceKey }) {
  const pageKey = instanceKey.split('@')[0];
  const hashIndex = pageKey.indexOf('#');
  if (hashIndex === -1) {
    return `page "${pageId}"`;
  }
  return `page "${pageId}" (${pageKey.slice(hashIndex + 1)})`;
}

// The engine context of a page instance: `{ context }`, or `{ error }` as a browser tab answers it.
function findPageContext({ lowdefy, page }) {
  if (type.isNone(page)) {
    return { error: 'No page has rendered in this tab yet.' };
  }
  const context = lowdefy?.contexts?.[page.instanceKey];
  if (type.isNone(context)) {
    return { error: `No live context for ${describePage(page)}.` };
  }
  return { context };
}

export default findPageContext;
