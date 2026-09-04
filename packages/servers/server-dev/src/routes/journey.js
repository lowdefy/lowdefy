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

import loggerConfig from '../../lib/build/logger.js';

// The dev twin of the production journey beacon. The recorder records every
// session in dev and its trace events carry the event payload and the written
// values, because in dev the developer is the user.
async function journeyHandler(c) {
  if (c.req.method !== 'POST') {
    return c.json({ error: 'Method not allowed.' }, 405);
  }

  const origin = c.req.header('origin');
  if (!origin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  try {
    if (new URL(origin).host !== c.req.header('host')) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  } catch {
    return c.json({ error: 'Forbidden' }, 403);
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
