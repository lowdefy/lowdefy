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

function listNames(names) {
  return names
    .sort()
    .map((name) => `"${name}"`)
    .join(', ');
}

// Gives the requests of one request type an answer of the test's own, for the rest of the
// session: `fn` is called with the request as the session records it in `sunk`
// ({ connectionId, connectionType, requestType, requestId, pageId, endpointId, request }) and
// what it returns, or resolves to, is the request's response; what it throws is the request's
// failure. Without a stub a request to an outside service answers null, which breaks a routine
// that reads the answer. A stub on a connection type that does not say how it runs under a
// data session lets that request type through, and only that one (createSessionConnections).
function stubRequest({ connectionType, fn, requestType, testSession }) {
  checkSessionOpen({ testSession });
  if (typeof fn !== 'function') {
    throw new Error(
      `stub takes a function that answers the request. Received ${JSON.stringify(
        fn
      )} for ${connectionType} ${requestType}.`
    );
  }
  const { connections } = testSession.runtime;
  if (type.isNone(connections[connectionType])) {
    throw new Error(
      `Connection type ${JSON.stringify(
        connectionType
      )} is not used by this app. Its connection types are ${listNames(Object.keys(connections))}.`
    );
  }
  const requests = connections[connectionType].requests ?? {};
  if (type.isNone(requests[requestType])) {
    throw new Error(
      `Request type ${JSON.stringify(
        requestType
      )} is not a request of connection type "${connectionType}". Its request types are ${listNames(
        Object.keys(requests)
      )}.`
    );
  }
  const stubs = testSession.stubs.get(connectionType) ?? new Map();
  stubs.set(requestType, fn);
  testSession.stubs.set(connectionType, stubs);
}

export default stubRequest;
