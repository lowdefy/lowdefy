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

import authJson from '../../lib/build/auth.js';
import getAuth from '../../lib/server/auth/getAuth.js';

// Mounts BetterAuth's Web Standard handler on /api/auth/*. Hono routes HEAD
// requests through GET handlers, so the corporate-email link-checker
// pre-check must short-circuit before delegating to the handler. See:
// https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
function authMiddleware({ logger }) {
  return async function auth(c) {
    if (authJson.configured !== true) {
      return c.json({ message: 'Auth not configured' }, 404);
    }
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return getAuth({ logger }).handler(c.req.raw);
  };
}

export default authMiddleware;
