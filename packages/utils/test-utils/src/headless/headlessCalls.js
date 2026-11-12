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

import callFromPage from '../callFromPage.js';
import readPageAs from '../readPageAs.js';
import readRootConfigAs from '../readRootConfigAs.js';
import resolveSessionUser from '../resolveSessionUser.js';
import testSessions from '../testSessions.js';

// The calls a page shown without a browser makes on a session openSession opened
// (@lowdefy/journey-headless): read the root config and a page as the route sends them, and post
// a request or an endpoint call as the page's client does. `user` takes the forms session.as()
// takes. buildDirectory is where the client plugins the build wrote are imported from.
function headlessCalls(session) {
  const testSession = testSessions.get(session);
  if (testSession === undefined) {
    throw new Error('headlessCalls takes a session opened with openTestApp(...).openSession().');
  }
  return {
    buildDirectory: testSession.testApp.directories.build,
    call: ({ body, endpointId, kind, pageId, requestId, user }) =>
      callFromPage({
        body,
        endpointId,
        kind,
        pageId,
        requestId,
        testSession,
        user: resolveSessionUser({ testSession, user }),
      }),
    readPage: ({ path, urlQuery, user }) =>
      readPageAs({
        path,
        testSession,
        urlQuery,
        user: resolveSessionUser({ testSession, user }),
      }),
    readRootConfig: ({ user }) =>
      readRootConfigAs({ testSession, user: resolveSessionUser({ testSession, user }) }),
    resolveUser: (user) => resolveSessionUser({ testSession, user }),
  };
}

export default headlessCalls;
