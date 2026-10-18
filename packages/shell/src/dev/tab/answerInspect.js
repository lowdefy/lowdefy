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

import findPageContext from './findPageContext.js';

/**
 * The answer to an inspect-request: the page instance's live state, as a browser tab answers it
 * (server-dev client/Inspector.jsx), a serialized string the dev server deserializes
 * (lib/docs/inspectStateFromTab.js). The URL query is the shown route's.
 */
function answerInspect({ lowdefy, page }) {
  const { context, error } = findPageContext({ lowdefy, page });
  if (error) {
    return { error };
  }
  return serializer.serializeToString({
    pageId: page.pageId,
    pathParams: context.pathParams,
    instanceKey: page.instanceKey,
    state: context.state,
    requests: context.requests,
    eventLog: (context.eventLog ?? []).slice(-50),
    global: lowdefy.lowdefyGlobal,
    user: lowdefy.user,
    input: lowdefy.inputs?.[page.instanceKey],
    urlQuery: lowdefy._internal.globals.window.location.search,
  });
}

export default answerInspect;
