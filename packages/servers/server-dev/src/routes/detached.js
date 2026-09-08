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

import { runDetachedEndpoint } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

// Target of a CallApi step with `detached: true`: the calling invocation
// fire-and-forgets a POST here, so the endpoint runs in its OWN function
// invocation with a fresh duration budget (chainable bounded work without a
// queue). Same transport auth as cron (CRON_SECRET, fails closed) and the same
// system execution context — InternalApi endpoints are callable, `_user` is
// undefined. Delivery is at-most-once with no retry: targets must be
// idempotent.
async function detachedHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const context = c.get('lowdefyContext');

  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header('authorization') !== `Bearer ${secret}`) {
    context.logger.warn({ event: 'detached_unauthorized' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const endpointId = getPathSegments(c, '/api/detached/').join('/');
  const { payload } = await c.req.json();
  context.logger.info({ event: 'call_detached_endpoint', endpointId });
  const response = await runDetachedEndpoint(context, { endpointId, payload });
  return c.json(response);
}

export default detachedHandler;
