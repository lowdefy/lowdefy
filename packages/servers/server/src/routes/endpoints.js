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

import { callEndpoint, getEndpointConfig, runHookEndpoint } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

async function endpointsHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const context = c.get('lowdefyContext');
  const endpointId = getPathSegments(c, '/api/endpoints/').join('/');

  // Endpoints opting in with `hook: true` are third-party webhook receivers
  // (SNS, Event Grid, Stripe, ...): they take the request RAW — body in the
  // caller's own format (not the { payload } envelope), plus query + headers —
  // and their return value is sent back verbatim, because webhook handshakes
  // (e.g. Event Grid's validationResponse) require exact response shapes.
  // The config lookup is a cached file read; an unknown endpoint falls through
  // to the standard path so its error shape is unchanged. Everything about
  // non-hook endpoints is untouched.
  let endpointConfig = null;
  try {
    endpointConfig = await getEndpointConfig(context, { endpointId });
  } catch {
    /* unknown endpoint — the standard path below reports it exactly as before */
  }
  if (endpointConfig?.hook === true) {
    // SNS posts JSON as text/plain — parse regardless of content-type; an
    // unparseable body arrives as the raw string.
    const raw = await c.req.text();
    let body = raw;
    try {
      body = JSON.parse(raw);
    } catch {
      /* non-JSON body — raw string passthrough */
    }
    context.logger.info({ event: 'call_hook_endpoint', endpointId });
    const result = await runHookEndpoint(context, {
      endpointId,
      body,
      query: c.req.query(),
      headers: c.req.header(),
    });
    if (!result.success) {
      return c.json({ error: 'Hook failed.' }, 500);
    }
    return c.json(result.response ?? { ok: true });
  }

  const { blockId, payload, pageId } = await c.req.json();
  context.logger.info({ event: 'call_api_endpoint', blockId, endpointId, pageId });
  const response = await callEndpoint(context, { blockId, endpointId, pageId, payload });
  return c.json(response);
}

export default endpointsHandler;
