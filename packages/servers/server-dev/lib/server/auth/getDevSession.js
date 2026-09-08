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

import { createSessionCallback } from '@lowdefy/api';

import authJson from '../../build/auth.js';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import getHeadlessUser from './getHeadlessUser.js';
import getMockUser from './getMockUser.js';

// THE single source of dev sessions (mock user, headless renderer). Two
// invariants live here, by construction rather than by convention:
//
// 1. Prod parity: the dev user runs through the identical Auth.js session
//    callback a real sign-in uses (OIDC claim copy, userFields mapping,
//    custom session-callback plugins, roles validation, hashed_id) — so what
//    a mock or headless session sees is exactly what a real authenticated
//    user would see in production, and dev validates prod behaviour.
// 2. Client/server parity: every consumer — the server request context
//    (session.js) and the browser client's GET /api/auth/session
//    (routes/auth.js) — obtains the session from this one function, so the
//    two can never diverge.
//
// Auth.js sessions carry an expires timestamp (the client SessionProvider
// schedules refetches off it); dev sessions never expire while the server
// runs, a day keeps polling calm.
const DEV_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function getDevSession(c) {
  const user = getMockUser() ?? getHeadlessUser(c);
  if (!user) {
    return undefined;
  }
  // Without auth configured nothing is protected and there is no session
  // callback pipeline to run — a dev session would not match any prod
  // behaviour. (A configured mock user already threw in getMockUser.)
  if (authJson.configured !== true) {
    return undefined;
  }

  const sessionCallback = createSessionCallback({
    authConfig: authJson,
    plugins: { callbacks },
  });

  // The dev user acts as both token and user, exactly how a decoded JWT
  // reaches the session callback on a real request.
  const session = await sessionCallback({
    session: { user: {} },
    token: user,
    user,
  });
  session.expires = new Date(Date.now() + DEV_SESSION_MAX_AGE_MS).toISOString();
  return session;
}

export default getDevSession;
