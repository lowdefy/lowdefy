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

async function clientErrorHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');

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

  const body = await c.req.json();
  // Strip received from payload — prod doesn't need it for schema validation
  if (body?.['~e']) {
    delete body['~e'].received;
  }
  await logClientError(context, body);

  return c.json({ success: true });
}

export default clientErrorHandler;
