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

function listNames(names) {
  return names
    .sort()
    .map((name) => `"${name}"`)
    .join(', ');
}

// Whether the app has the request type a stub answers: `connections` is the app's connection
// plugin map, by connection type. A stub on a type the app does not have would never answer, so
// it is refused. Returns the error naming the types the app has, or undefined.
function checkStubTarget({ connections, connectionType, requestType }) {
  if (type.isNone(connections[connectionType])) {
    return `Connection type ${JSON.stringify(
      connectionType
    )} is not used by this app. Its connection types are ${listNames(Object.keys(connections))}.`;
  }
  const requests = connections[connectionType].requests ?? {};
  if (type.isNone(requests[requestType])) {
    return `Request type ${JSON.stringify(
      requestType
    )} is not a request of connection type "${connectionType}". Its request types are ${listNames(
      Object.keys(requests)
    )}.`;
  }
  return undefined;
}

export default checkStubTarget;
