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

import { getAuthUser } from '@hono/auth-js';

import authJson from '../../build/auth.js';
import getDevSession from './getDevSession.js';

// Replaces getServerSession.js — dev sessions (mock user, headless renderer)
// first, then the session from the Hono context populated by initAuthConfig.
// getDevSession is the same function the client's GET /api/auth/session is
// answered from (routes/auth.js), so server and client sessions match by
// construction.
async function getSession(c) {
  const devSession = await getDevSession(c);
  if (devSession) {
    return devSession;
  }
  if (authJson.configured !== true) {
    return undefined;
  }
  const authUser = await getAuthUser(c);
  return authUser?.session ?? undefined;
}

export default getSession;
