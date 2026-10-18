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

import { createHash } from 'node:crypto';

// base64url(SHA-256(value)), unpadded: a PKCE S256 code challenge for a
// verifier (RFC 7636), and the key BetterAuth's one-time-token plugin stores a
// hashed token under (its defaultKeyHasher).
function sha256Base64Url(value) {
  return createHash('sha256').update(value).digest('base64url');
}

export default sha256Base64Url;
