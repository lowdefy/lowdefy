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

import { generateRandomString } from 'better-auth/crypto';

import getOneTimeTokenIdentifiers from './getOneTimeTokenIdentifiers.js';
import storeCodeChallenge from './storeCodeChallenge.js';

// Mints the one-time token for the phone's session, the record BetterAuth's
// one-time-token plugin verifies at /one-time-token/verify: the session token
// under the hashed one-time token (storeToken: 'hashed'), for one minute. The
// plugin's own generate endpoint mints for the caller's session, which is the
// browser's; the phone gets a session of its own (createPhoneSession). The
// token is bound to the shell's PKCE code challenge.
async function mintOneTimeToken({ auth, codeChallenge, sessionToken }) {
  const { internalAdapter } = await auth.$context;
  const token = generateRandomString(32);
  await internalAdapter.createVerificationValue({
    identifier: getOneTimeTokenIdentifiers({ token }).token,
    value: sessionToken,
    expiresAt: new Date(Date.now() + 60 * 1000),
  });
  await storeCodeChallenge({ auth, codeChallenge, token });
  return token;
}

export default mintOneTimeToken;
