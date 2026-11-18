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

import checkStubTarget from './checkStubTarget.js';

// A journey's answer stubs checked against the app, as session.stub checks its own
// (checkStubTarget): an answer stub on a connection type or request type the app does not have
// would never answer. `connections` is the app's connection plugin map. A forced failure is keyed
// by request id alone, so it has no type to check. Returns the error naming the stub, or
// undefined.
function checkJourneyStubTargets({ connections, stubs }) {
  for (const [index, stub] of (stubs ?? []).entries()) {
    if (!type.isUndefined(stub.fail)) {
      continue;
    }
    const error = checkStubTarget({
      connections,
      connectionType: stub.connectionType,
      requestType: stub.requestType,
    });
    if (!type.isUndefined(error)) {
      return `Journey "stubs[${index}]": ${error}`;
    }
  }
  return undefined;
}

export default checkJourneyStubTargets;
