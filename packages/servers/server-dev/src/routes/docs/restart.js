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

import { type } from '@lowdefy/helpers';
import requestRestart from '../../../lib/docs/requestRestart.js';

async function docsRestartHandler(c) {
  let body = {};
  try {
    body = await c.req.json();
  } catch {
    // An empty body is a valid request with no reason.
  }
  const reason = type.isString(body?.reason) ? body.reason : undefined;
  const result = requestRestart({ reason });
  return c.json({
    ...result,
    note:
      'The dev server is restarting. Wait ~2s, then poll GET /lowdefy-docs/build-status before ' +
      'your next call. The restart discards the serverErrors and devNotices collected this ' +
      'session — they live in the server process only.',
  });
}

export default docsRestartHandler;
