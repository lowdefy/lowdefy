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

import answerCall from './answerCall.js';
import checkSessionOpen from './checkSessionOpen.js';
import toWirePayload from './toWirePayload.js';

// Calls an endpoint as POST /api/endpoints/<endpointId> does, from an API client: no page and
// no block are named, so a payload the endpoint's payloadSchema refuses is the caller's
// mistake, a 400. The endpoint's auth, its payloadSchema and InternalApi are enforced by
// callEndpoint, as on the route.
async function callEndpointAs({ endpointId, payload, testSession, user }) {
  checkSessionOpen({ testSession });
  if (!type.isString(endpointId)) {
    throw new Error(`call requires an endpoint id. Received ${JSON.stringify(endpointId)}.`);
  }
  const { testApp } = testSession;
  return answerCall({
    req: { url: `/api/endpoints/${endpointId}`, method: 'POST', hostname: 'localhost' },
    run: (context) =>
      testApp.modules.api.callEndpoint(context, {
        blockId: undefined,
        endpointId,
        pageId: undefined,
        payload: toWirePayload({ payload, testApp }),
      }),
    testSession,
    user,
  });
}

export default callEndpointAs;
