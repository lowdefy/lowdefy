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

import crypto from 'node:crypto';

import { journeyActorToken } from '../auth/journeyActor.js';

const tokenBuffer = Buffer.from(journeyActorToken);

function findCookieValue({ cookieHeader, name }) {
  for (const pair of (cookieHeader ?? '').split(';')) {
    const separator = pair.indexOf('=');
    if (separator !== -1 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
}

// Returns the payload of a journey cookie the dev server's own headless
// browser wrote (writeJourneyCookie), or null when the cookie is absent or
// its token is not this process's journeyActorToken.
function readJourneyCookie({ cookieHeader, name }) {
  const value = findCookieValue({ cookieHeader, name });
  if (value === null) {
    return null;
  }
  const separator = value.indexOf('.');
  if (separator === -1) {
    return null;
  }
  const token = Buffer.from(value.slice(0, separator));
  if (token.length !== tokenBuffer.length || !crypto.timingSafeEqual(token, tokenBuffer)) {
    return null;
  }
  return value.slice(separator + 1);
}

export default readJourneyCookie;
