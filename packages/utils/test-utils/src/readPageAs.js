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

import checkSessionOpen from './checkSessionOpen.js';
import createCallContext from './createCallContext.js';

// What the page route sends a client for a path, as the caller: when the caller may open the page,
// its config as JSON (the HTML embeds it as JSON, still in its serialized form). `status` is
// getPageConfig's (ok, not_found, unauthenticated, unauthorized, enrol_required, wrong_surface);
// `pageConfig` is null unless it is ok. `path` is the page's path, with no leading "/".
async function readPageAs({ path, testSession, urlQuery, user }) {
  checkSessionOpen({ testSession });
  if (!type.isString(path)) {
    throw new Error(
      `A page is read by its path, such as "tickets/42". Received ${JSON.stringify(path)}.`
    );
  }
  const { getPageConfig } = testSession.testApp.modules.api;
  const context = createCallContext({
    faults: [],
    req: { url: `/${path}`, method: 'GET', hostname: 'localhost' },
    testSession,
    user,
  });
  const result = await getPageConfig(context, { path, urlQuery: urlQuery ?? {} });
  return {
    status: result.status,
    pageId: result.pageId ?? null,
    pathParams: result.pathParams ?? null,
    pageConfig: type.isNone(result.pageConfig)
      ? null
      : JSON.parse(JSON.stringify(result.pageConfig)),
  };
}

export default readPageAs;
