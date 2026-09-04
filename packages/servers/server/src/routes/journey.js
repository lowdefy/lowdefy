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

import { logJourneyBatch } from '@lowdefy/api';

import createSameOriginGuard from '../middleware/createSameOriginGuard.js';
import loggerConfig from '../../lib/build/logger.js';

const guardSameOrigin = createSameOriginGuard();

// The journey recorder's beacon. Same-origin only and unauthenticated, like
// /api/client-error: the browser sends no identity, and logJourneyBatch stamps
// the caller from the server's own context. Always answers 204 on the happy
// path - a beacon has nobody to read a response.
async function journeyHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }

  const forbidden = guardSameOrigin(c);
  if (forbidden) {
    return forbidden;
  }

  const context = c.get('lowdefyContext');
  const result = await logJourneyBatch(context, {
    batch: await c.req.json(),
    journeys: loggerConfig.journeys,
  });

  if (result.status === 'invalid') {
    return c.json({ error: result.message }, 400);
  }
  return c.body(null, 204);
}

export default journeyHandler;
