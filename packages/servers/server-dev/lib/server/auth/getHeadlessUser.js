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

import JOURNEY_COOKIES from '../journeyCookies/JOURNEY_COOKIES.js';
import readJourneyCookie from '../journeyCookies/readJourneyCookie.js';
import { remoteCallerHeader } from '../pairingHeaders.js';

// The headless renderer (getBrowser.js) sets a signed caller cookie on its own
// browser context, so its /api/* fetches carry a pre-resolved caller while the
// developer's real browser (no cookie) is unaffected. Only a cookie signed with
// this dev server's journeyActorToken is read: any other request could
// otherwise name its own user and roles. Returns { user, explicit } as
// getBrowser.js wrote it, or null on miss - the caller floors the user's shape
// via normalizeInjectedCaller. `explicit` is true when the tool call or journey
// named the user, so createLowdefyContext lets it beat a dev mock user.
// A request from another machine (a phone paired with `lowdefy dev --lan`) is
// never a headless one, so it is refused even with a valid cookie.
function getHeadlessUser(c) {
  if (c.req.header(remoteCallerHeader) !== undefined) {
    return null;
  }
  const payload = readJourneyCookie({
    cookieHeader: c.req.header('cookie'),
    name: JOURNEY_COOKIES.headlessUser.name,
  });
  if (payload === null) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString());
  } catch {
    return null;
  }
}

export default getHeadlessUser;
