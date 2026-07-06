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

import { runHookEndpoint } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

// Public receiver for third-party webhooks (SNS, Event Grid, Stripe, ...) —
// their POST bodies are the caller's own format, not the /api/endpoints
// { payload } envelope. Only endpoints declaring `hook: true` are reachable;
// the routine gets { body, query, headers } as payload and owns caller
// authentication (shared-secret query param, signature header). The routine's
// return value is sent back RAW as the response body — webhook handshakes
// (e.g. Event Grid's validationResponse) require exact response shapes.
// Bodies are parsed as JSON regardless of content-type (SNS posts JSON as
// text/plain); unparseable bodies arrive as the raw string.
async function hooksHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const context = c.get('lowdefyContext');
  const endpointId = getPathSegments(c, '/api/hooks/').join('/');

  const raw = await c.req.text();
  let body = raw;
  try {
    body = JSON.parse(raw);
  } catch {
    /* non-JSON body — pass the raw string through */
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

export default hooksHandler;
