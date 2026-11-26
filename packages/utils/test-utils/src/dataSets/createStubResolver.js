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

import { serializer, type } from '@lowdefy/helpers';

import describeSunkRequest from './describeSunkRequest.js';
import findStub from './findStub.js';

// The resolver of a stubbed request type. The first stub on the session that matches the request
// answers it: a test's stub is called with the request's record and answers for the service, a
// journey's stub answers its literal `answer`. Either way the request is recorded in `sunk`. A
// request no stub matches goes to `fallback`, the resolver it would have had with no stub. The
// connection's properties are never passed on: they hold its credentials.
function createStubResolver({ connectionType, context, fallback, requestType, session }) {
  return async function stubResolver(args) {
    const record = describeSunkRequest({ args, connectionType, context, requestType });
    const stub = findStub({ record, session });
    if (type.isUndefined(stub)) {
      return fallback(args);
    }
    session.sunk.push(record);
    // A journey's stub counts its answers (listUnansweredStubs); a test's session.stub does not.
    if (type.isNumber(stub.answered)) {
      stub.answered += 1;
    }
    if (type.isFunction(stub.fn)) {
      return stub.fn(record);
    }
    // A copy, so a routine that changes the answer leaves the stub as written.
    return serializer.copy(stub.answer);
  };
}

export default createStubResolver;
