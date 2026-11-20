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

import answerCall from './answerCall.js';
import checkSessionOpen from './checkSessionOpen.js';

// Calls a page request or an endpoint as a page's client posts it, and answers as answerCall does.
// `body` is the JSON body the client sends: { actionId, blockId, payload } for a request and
// { blockId, pageId, payload } for an endpoint, with the payload already serialized by the
// engine. It goes through JSON and the route's body parser, as over HTTP, and the route's
// arguments are taken from it: an endpoint called from a page names its page and block.
async function callFromPage({ body, endpointId, kind, pageId, requestId, testSession, user }) {
  checkSessionOpen({ testSession });
  const { testApp } = testSession;
  const { callEndpoint, callRequest, parseRequestBody } = testApp.modules.api;
  const parsed = parseRequestBody({ text: JSON.stringify(body ?? {}) });
  if (kind === 'request') {
    return answerCall({
      req: { url: `/api/request/${pageId}/${requestId}`, method: 'POST', hostname: 'localhost' },
      run: (context) =>
        callRequest(context, {
          blockId: parsed.blockId,
          pageId,
          payload: parsed.payload,
          requestId,
        }),
      testSession,
      user,
    });
  }
  if (kind === 'endpoint') {
    return answerCall({
      req: { url: `/api/endpoints/${endpointId}`, method: 'POST', hostname: 'localhost' },
      run: (context) =>
        callEndpoint(context, {
          blockId: parsed.blockId,
          endpointId,
          pageId: parsed.pageId,
          payload: parsed.payload,
        }),
      testSession,
      user,
    });
  }
  throw new Error(`A page call is a "request" or an "endpoint". Received ${JSON.stringify(kind)}.`);
}

export default callFromPage;
