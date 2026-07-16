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
// queue). Transport auth is CRON_SECRET (fails closed), which proves the
// request originated from the deployment. The run carries the DISPATCHER'S
// identity (Decision 4): the request body carries a server-built principal
// snapshot that runDetachedEndpoint rehydrates, so nested calls authorize
// against the dispatcher, not a forced system context. Delivery is at-most-once
// with no retry: targets must be idempotent.
async function detachedHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const context = c.get('lowdefyContext');

  // The secret gate stays first: an external POST without the secret is
  // rejected before the body (and its principal assertion) is ever read.
  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header('authorization') !== `Bearer ${secret}`) {
    context.logger.warn({ event: 'detached_unauthorized' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const endpointId = getPathSegments(c, '/api/detached/').join('/');
  const { payload, principal } = await c.req.json();
  context.logger.info({ event: 'call_detached_endpoint', endpointId });
  const response = await runDetachedEndpoint(context, { endpointId, payload, principal });
  return c.json(response);
}

export default detachedHandler;
