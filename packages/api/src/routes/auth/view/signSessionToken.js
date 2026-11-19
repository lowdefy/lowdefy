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

import { createHmac } from 'node:crypto';

// The signed form of a session token: the value BetterAuth puts in its session
// cookie and in the bearer plugin's set-auth-token header, and the only form
// the bearer plugin accepts under requireSignature. BetterAuth signs a token
// only as it writes a response cookie, so a session made outside a sign-in
// request is signed here, the same way: an HMAC-SHA256 of the token under the
// auth secret, base64, joined by a dot and URI-encoded.
function signSessionToken({ secret, token }) {
  const signature = createHmac('sha256', secret).update(token).digest('base64');
  return encodeURIComponent(`${token}.${signature}`);
}

export default signSessionToken;
