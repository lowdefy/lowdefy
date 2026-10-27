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

import sha256Base64Url from './sha256Base64Url.js';

// The verification records a one-time token is kept under: the token itself
// (written by BetterAuth's one-time-token plugin, hashed as storeToken: 'hashed'
// hashes it) and the PKCE code challenge it is bound to (storeCodeChallenge).
function getOneTimeTokenIdentifiers({ token }) {
  const hashedToken = sha256Base64Url(token);
  return {
    challenge: `one-time-token-challenge:${hashedToken}`,
    token: `one-time-token:${hashedToken}`,
  };
}

export default getOneTimeTokenIdentifiers;
