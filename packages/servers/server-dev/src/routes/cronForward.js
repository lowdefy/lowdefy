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

import { forwardScheduledEndpoint } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

// Triggered by Vercel Cron on the production deployment: an HTTP GET to
// /api/cron-forward/<environment>/<endpointId>, registered by `lowdefy vercel-output` for the
// schedules of every environment declared with a url in config.cron.environments. Vercel fires crons
// only on production, so production pings that environment's own /api/cron/<endpointId> (with the
// environment's CRON_SECRET) and answers immediately. Same transport auth as cron (CRON_SECRET,
// fails closed).
async function cronForwardHandler(c) {
  if (c.req.method !== 'GET') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');

  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header('authorization') !== `Bearer ${secret}`) {
    context.logger.warn({ event: 'cron_forward_unauthorized' });
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const [environment, ...endpointSegments] = getPathSegments(c, '/api/cron-forward/');
  const endpointId = endpointSegments.join('/');
  const cron = c.req.header('x-vercel-cron-schedule');
  context.logger.info({ event: 'call_cron_forward', environment, endpointId, cron });
  const response = await forwardScheduledEndpoint(context, { environment, endpointId, cron });
  return c.json(response);
}

export default cronForwardHandler;
