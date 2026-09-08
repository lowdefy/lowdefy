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

import { authHandler } from '@hono/auth-js';

import authJson from '../../lib/build/auth.js';

// Replaces pages/api/auth/[...nextauth].js. Hono routes HEAD requests through
// GET handlers, so the corporate-email pre-check branch must live inside the
// middleware, before delegating to the Auth.js handler. See:
// https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
function authMiddleware() {
  const handler = authJson.configured === true ? authHandler() : null;
  return async function auth(c, next) {
    if (authJson.configured !== true) {
      return c.json({ message: 'Auth not configured' }, 404);
    }
    if (c.req.method === 'HEAD') {
      return c.body(null, 200);
    }
    return handler(c, next);
  };
}

export default authMiddleware;
