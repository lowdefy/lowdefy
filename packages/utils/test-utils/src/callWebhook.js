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
import createCallContext from './createCallContext.js';
import createErrorAnswer from './createErrorAnswer.js';

// Header names as they reach the route: HTTP sends them case-insensitively and the server reads
// them lower-cased, so a verifier reads headers['x-signature'] whichever case the test wrote.
function toHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([name, value]) => [name.toLowerCase(), value])
  );
}

// Posts to a webhook endpoint as its sender does, through runWebhookEndpoint, the entry the
// endpoints route runs for an endpoint declared `webhook`: no caller, and its verify gate runs
// against rawBody, the body exactly as posted, before the routine. Answers what the route sends,
// { status, body, contentType, faults }: body is the JSON (or, for a text/plain answer, the text)
// the sender receives, and faults are the errors the server would log at error level. A webhook
// that throws (no such webhook endpoint, a verifier that cannot be configured) is answered as the
// servers' error handler answers it.
async function callWebhook({ endpointId, headers, query, rawBody, testSession }) {
  checkSessionOpen({ testSession });
  if (!type.isString(endpointId)) {
    throw new Error(`webhook requires an endpoint id. Received ${JSON.stringify(endpointId)}.`);
  }
  if (!type.isString(rawBody)) {
    throw new Error(
      `webhook requires the raw body as a string. Received ${JSON.stringify(rawBody)}.`
    );
  }
  const { testApp } = testSession;
  const faults = [];
  const context = createCallContext({
    faults,
    req: { url: `/api/endpoints/${endpointId}`, method: 'POST', hostname: 'localhost' },
    testSession,
    user: null,
  });
  try {
    const answer = await testApp.modules.api.runWebhookEndpoint(context, {
      endpointId,
      headers: toHeaders(headers),
      query: query ?? {},
      rawBody,
    });
    if (answer.contentType === 'text/plain') {
      return { status: answer.status, body: answer.body, contentType: 'text/plain', faults };
    }
    return {
      status: answer.status,
      body: JSON.parse(JSON.stringify(answer.body)),
      contentType: 'application/json',
      faults,
    };
  } catch (error) {
    const { body, status } = await createErrorAnswer({ context, error, faults, testApp });
    return { status, body, contentType: 'application/json', faults };
  }
}

export default callWebhook;
