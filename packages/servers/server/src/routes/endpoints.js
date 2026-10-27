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

import {
  callEndpoint,
  getEndpointConfig,
  parseRequestBody,
  runLinkEndpoint,
  runWebhookEndpoint,
} from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import getPathSegments from '../lib/getPathSegments.js';

// A GET serves a link endpoint (`link: true`): typically an <img src> or a download link, sent
// by the browser with the session cookie and no Lowdefy headers. The routine runs as that caller
// and the answer is a 302 to the URL it returns, or a status with no body. The noStore middleware
// sets Cache-Control: private, no-store on it, so a redirect to a short-lived URL is never cached.
async function linkHandler(c) {
  const context = c.get('lowdefyContext');
  const { status, location, body } = await runLinkEndpoint(context, {
    segments: getPathSegments(c, '/api/endpoints/'),
    query: c.req.query(),
  });
  if (status === 302) {
    return c.redirect(location, 302);
  }
  if (type.isNone(body)) {
    return c.body(null, status);
  }
  return c.json(body, status);
}

async function endpointsHandler(c) {
  if (c.req.method === 'GET') {
    return linkHandler(c);
  }
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');
  const endpointId = getPathSegments(c, '/api/endpoints/').join('/');

  // Endpoints opting in with `webhook` (true or a { verify } object) are
  // third-party webhook receivers (SNS, Event Grid, Stripe, ...): they take the
  // request RAW — body in the caller's own format (not the { payload }
  // envelope), plus query + headers — and their return value is sent back
  // verbatim, because webhook handshakes (e.g. Event Grid's validationResponse)
  // require exact response shapes. The config lookup is a cached file read; an
  // unknown endpoint falls through to the standard path so its error shape is
  // unchanged. Everything about non-webhook endpoints is untouched.
  let endpointConfig = null;
  try {
    endpointConfig = await getEndpointConfig(context, { endpointId });
  } catch {
    /* unknown endpoint — the standard path below reports it exactly as before */
  }
  if (endpointConfig?.webhook) {
    context.logger.info({ event: 'call_webhook_endpoint', endpointId });
    const { status, body, contentType } = await runWebhookEndpoint(context, {
      endpointId,
      rawBody: await c.req.text(),
      query: c.req.query(),
      headers: c.req.header(),
    });
    if (contentType === 'text/plain') {
      // A text answer often echoes a value from the request (a handshake token), so the browser
      // must not sniff it into HTML.
      c.header('X-Content-Type-Options', 'nosniff');
      return c.text(body, status);
    }
    return c.json(body, status);
  }

  const { blockId, payload, pageId } = parseRequestBody({ text: await c.req.text() });
  context.logger.info({ event: 'call_api_endpoint', blockId, endpointId, pageId });
  const response = await callEndpoint(context, { blockId, endpointId, pageId, payload });
  return c.json(response);
}

export default endpointsHandler;
