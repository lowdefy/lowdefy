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

import { handleAuthRequest } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

import authJson from '../../lib/build/auth.js';
import getAuth from '../../lib/server/auth/getAuth.js';
import getClientAddress from '../../lib/server/getClientAddress.js';
import getMockUser from '../../lib/server/auth/getMockUser.js';

// Mounts BetterAuth's Web Standard handler on /api/auth/*. Hono routes HEAD
// requests through GET handlers, so HEAD short-circuits before the handler -
// corporate email link-checkers pre-fetch magic-link and verification URLs
// with HEAD, and letting those reach the handler would consume the one-time
// token before the user clicks. BetterAuth rate-limits by the client address
// getClientAddress resolves.
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
    if (!type.isNone(c.get('lowdefyContext')?.dataSet)) {
      // A journey on a data set: the auth engine is bound to the app's real auth database, so its
      // browser contexts never reach it. Data set users are injected callers; the get-session stub
      // in app.js answers for them.
      return c.json({ message: 'Auth engine disabled for journeys on a data set' }, 404);
    }
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return handleAuthRequest({
      auth: getAuth({ logger }),
      request: c.req.raw,
      clientAddress: getClientAddress(c),
    });
  };
}

export default authMiddleware;
