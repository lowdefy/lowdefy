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

import callEndpointAs from './callEndpointAs.js';
import callRequestAs from './callRequestAs.js';
import getPageAs from './getPageAs.js';
import resolveSessionUser from './resolveSessionUser.js';

// A caller of the session: what session.as(user) returns. The user is resolved once, so an
// unknown user name fails here, on the line that names it.
function createSessionCaller({ testSession, user }) {
  const resolved = resolveSessionUser({ testSession, user });
  return {
    call: (endpointId, payload) =>
      callEndpointAs({ endpointId, payload, testSession, user: resolved }),
    page: (path) => getPageAs({ path, testSession, user: resolved }),
    request: (pageId, requestId, payload) =>
      callRequestAs({ pageId, payload, requestId, testSession, user: resolved }),
  };
}

export default createSessionCaller;
