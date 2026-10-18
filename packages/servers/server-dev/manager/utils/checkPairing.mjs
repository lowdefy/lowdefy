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

import { type } from '@lowdefy/helpers';

import isLoopbackAddress from './isLoopbackAddress.mjs';

/*
The dev server answers anyone on this computer: its dev tools let through a
request with no Origin header, and its headless-user cookie can make a caller
anyone. `lowdefy dev --lan` opens it to the local network for a phone, so a
request from another address must carry the session's pairing token, which
only the developer's terminal shows. Returns 'local', 'paired' or 'refused'.
*/
function checkPairing({ remoteAddress, pairToken, providedToken }) {
  if (isLoopbackAddress(remoteAddress)) {
    return 'local';
  }
  if (!type.isString(pairToken) || !type.isString(providedToken)) {
    return 'refused';
  }
  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(pairToken);
  if (provided.length !== expected.length) {
    return 'refused';
  }
  return crypto.timingSafeEqual(provided, expected) ? 'paired' : 'refused';
}

export default checkPairing;
