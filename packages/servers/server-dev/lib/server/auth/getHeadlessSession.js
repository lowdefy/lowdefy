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

import { HEADLESS_USER_COOKIE } from './headlessUser.js';

// Mirrors the e2e user-injection pattern (server-e2e/lib/server/auth/session.js):
// the headless renderer sets a base64-JSON user cookie on its own browser
// context, so its /api/* fetches carry a session while the developer's real
// browser (no cookie) is unaffected.
function getHeadlessSession(c) {
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${HEADLESS_USER_COOKIE}=([^;]+)`));
  if (!match) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(decodeURIComponent(match[1]), 'base64').toString();
    const user = JSON.parse(decoded);
    return { user };
  } catch {
    return undefined;
  }
}

export default getHeadlessSession;
