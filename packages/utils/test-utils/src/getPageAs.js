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

// What the page route decides for a path, from getPageConfig: `status` is ok, not_found,
// unauthenticated, unauthorized, enrol_required or wrong_surface, with the page's id and path
// parameters when the path matched a route. The route turns the status into a page or a
// redirect; the page's config is left out, since a test of what a page shows is a journey.
async function getPageAs({ path, testSession, user }) {
  checkSessionOpen({ testSession });
  if (!type.isString(path)) {
    throw new Error(
      `page requires a path, such as "/tickets/42". Received ${JSON.stringify(path)}.`
    );
  }
  const context = createCallContext({
    faults: [],
    req: { url: path, method: 'GET', hostname: 'localhost' },
    testSession,
    user,
  });
  const { status, pageId, pathParams } = await testSession.testApp.modules.api.getPageConfig(
    context,
    // The route passes the path with the base path and the leading "/" removed.
    { path: path.replace(/^\/+/, ''), urlQuery: {} }
  );
  return { status, pageId: pageId ?? null, pathParams: pathParams ?? null };
}

export default getPageAs;
