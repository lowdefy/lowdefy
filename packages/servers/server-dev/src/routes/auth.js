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
import getMockUser from '../../lib/server/auth/getMockUser.js';

// Mounts BetterAuth's Web Standard handler on /api/auth/*. Hono routes HEAD
// requests through GET handlers, so HEAD short-circuits before the handler -
// corporate email link-checkers pre-fetch magic-link and verification URLs
// with HEAD, and letting those reach the handler would consume the one-time
// token before the user clicks.
function authMiddleware({ logger }) {
  return async function auth(c) {
    if (authJson.configured !== true) {
      return c.json({ message: 'Auth not configured' }, 404);
    }
    if (getMockUser()) {
      // Mock user active - no auth engine runs; the get-session stub in
      // app.js is the only auth endpoint.
      return c.json({ message: 'Auth engine disabled while dev.mockUser is active' }, 404);
    }
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return getAuth({ logger }).handler(c.req.raw);
  };
}

export default authMiddleware;
