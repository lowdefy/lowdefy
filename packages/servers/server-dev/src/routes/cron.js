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

import { runScheduledEndpoint } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

// Triggered by Vercel Cron in production: an HTTP GET to /api/cron/<endpointId>. Available in dev so
// scheduled endpoints can be triggered locally with curl. Vercel auto-sends the value of the project
// env var named exactly CRON_SECRET as `Authorization: Bearer <value>`, and the firing cron
// expression in the `x-vercel-cron-schedule` header. Fails closed if CRON_SECRET is unset.
async function cronHandler(c) {
  if (c.req.method !== 'GET') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');

  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header('authorization') !== `Bearer ${secret}`) {
    context.logger.warn({ event: 'cron_unauthorized' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const endpointId = getPathSegments(c, '/api/cron/').join('/');
  const cron = c.req.header('x-vercel-cron-schedule');
  context.logger.info({ event: 'call_cron_endpoint', endpointId, cron });
  const response = await runScheduledEndpoint(context, { endpointId, cron });
  return c.json(response);
}

export default cronHandler;
