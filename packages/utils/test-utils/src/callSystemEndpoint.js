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
import checkSystemBinding from './checkSystemBinding.js';
import toWirePayload from './toWirePayload.js';

// Runs an endpoint as a trusted system context does: a cron run, or a detached run whose
// dispatcher was one. It goes through runDetachedEndpoint, the entry POST /api/detached runs,
// with a system principal: endpoint auth passes, and an InternalApi endpoint is callable, which
// callEndpoint never allows. With no organization the run is bound to none and _user is null.
// With one, it carries the binding a CallApi with "organization" and "caller" gives its target
// (the principal a detached call from such a run carries): the tenant wall filters and stamps
// with the organization, and _user is the stand-in caller { id, name, organization_id,
// system: true }, or null with no caller. The route answers 202 and runs the endpoint afterwards;
// here the call waits for the routine and answers its result.
async function callSystemEndpoint({
  caller = null,
  endpointId,
  organization = null,
  payload,
  testSession,
}) {
  checkSessionOpen({ testSession });
  if (!type.isString(endpointId)) {
    throw new Error(`call requires an endpoint id. Received ${JSON.stringify(endpointId)}.`);
  }
  checkSystemBinding({ caller, organization });
  const { testApp } = testSession;
  return answerCall({
    req: { url: `/api/detached/${endpointId}`, method: 'POST', hostname: 'localhost' },
    run: (context) =>
      testApp.modules.api.runDetachedEndpoint(context, {
        endpointId,
        payload: toWirePayload({ payload, testApp }),
        principal: { system: true, organizationId: organization, user: caller },
      }),
    testSession,
    user: null,
  });
}

export default callSystemEndpoint;
