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

import authJson from '../../lib/build/auth.js';
import getAuth from '../../lib/server/auth/getAuth.js';

// Mounts BetterAuth's Web Standard handler on /api/auth/*. Hono routes HEAD
// requests through GET handlers, so HEAD short-circuits before the handler -
// corporate email link-checkers pre-fetch magic-link and verification URLs
// with HEAD, and letting those reach the handler would consume the one-time
// token before the user clicks. The client address apiContext resolved is
// handed to BetterAuth for its rate limits and session records.
function authMiddleware({ logger }) {
  return async function auth(c) {
    if (authJson.configured !== true) {
      return c.json({ message: 'Auth not configured' }, 404);
    }
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return handleAuthRequest({
      auth: getAuth({ logger }),
      request: c.req.raw,
      clientAddress: c.get('lowdefyContext').clientAddress,
    });
  };
}

export default authMiddleware;
