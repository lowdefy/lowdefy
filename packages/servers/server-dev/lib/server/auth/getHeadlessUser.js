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

// Decodes the headless renderer's user cookie (set by getBrowser.js openPage
// on its own browser context, base64-encoded JSON) into the raw user object.
// Returns just the user; getDevSession.js turns it into a session through
// the same pipeline a real sign-in uses, so headless requests carry a
// prod-shaped session while the developer's real browser (no cookie) is
// unaffected.
function getHeadlessUser(c) {
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${HEADLESS_USER_COOKIE}=([^;]+)`));
  if (!match) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(decodeURIComponent(match[1]), 'base64').toString();
    return JSON.parse(decoded);
  } catch {
    return undefined;
  }
}

export default getHeadlessUser;
