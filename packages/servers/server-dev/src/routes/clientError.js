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

import { logClientError } from '@lowdefy/api';

import clientErrorStore from '../../lib/docs/clientErrorStore.js';
import createSameOriginGuard from '../middleware/createSameOriginGuard.js';

const guardSameOrigin = createSameOriginGuard();

async function clientErrorHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');

  const forbidden = guardSameOrigin(c);
  if (forbidden) {
    return forbidden;
  }

  // Dev keeps `received` in the payload — it powers error tracing in dev tools.
  const body = await c.req.json();
  const { error, ...response } = await logClientError(context, body);

  // Feed the agent-facing feedback loop (GET /lowdefy-docs/build-status) with a
  // serializable summary — not the full error object, which may carry
  // non-serializable `received` values.
  clientErrorStore.push({
    timestamp: new Date().toISOString(),
    name: error?.name ?? 'Error',
    message: error?.message ?? null,
    source: response.source ?? null,
    config: response.config ?? null,
  });

  return c.json(response);
}

export default clientErrorHandler;
