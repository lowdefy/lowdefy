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

// The resolver of a stubbed request type. The request is recorded on the session, in the shape
// a sunk request has, and the stub is called with that record and answers for the service. The
// connection's properties are never passed: they hold its credentials.
function createStubResolver({ connectionType, context, requestType, stub, testSession }) {
  const scrub = context.scrubSecrets;
  return async function stubResolver(args) {
    const record = {
      connectionId: args.connectionId,
      connectionType,
      requestId: args.requestId,
      pageId: args.pageId ?? null,
      endpointId: args.endpointId ?? null,
      request: type.isUndefined(args.request)
        ? null
        : JSON.parse(scrub(JSON.stringify(args.request))),
      requestType,
    };
    testSession.dataSession.sunk.push(record);
    return stub(record);
  };
}

export default createStubResolver;
