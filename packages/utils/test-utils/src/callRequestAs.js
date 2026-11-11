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

// Calls a page request as POST /api/request/<pageId>/<requestId> does. `payload` is what the
// page would send: the request's `payload` config evaluated in the browser, which the request's
// _payload operators read. Nothing evaluates it here, since no page is open.
async function callRequestAs({ pageId, payload, requestId, testSession, user }) {
  checkSessionOpen({ testSession });
  if (!type.isString(pageId) || !type.isString(requestId)) {
    throw new Error(
      `request requires a page id and a request id. Received ${JSON.stringify(
        pageId
      )} and ${JSON.stringify(requestId)}.`
    );
  }
  const { testApp } = testSession;
  return answerCall({
    req: { url: `/api/request/${pageId}/${requestId}`, method: 'POST', hostname: 'localhost' },
    run: (context) =>
      testApp.modules.api.callRequest(context, {
        blockId: undefined,
        pageId,
        payload: toWirePayload({ payload, testApp }),
        requestId,
      }),
    testSession,
    user,
  });
}

export default callRequestAs;
