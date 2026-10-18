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

import { type } from '@lowdefy/helpers';

import sha256Base64Url from './sha256Base64Url.js';

// RFC 7636 section 4.1: 43 to 128 unreserved characters.
const CODE_VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;

// Whether a PKCE code verifier is the one an S256 code challenge was made from.
function matchesCodeChallenge({ codeChallenge, codeVerifier }) {
  if (!type.isString(codeChallenge) || !type.isString(codeVerifier)) {
    return false;
  }
  if (!CODE_VERIFIER.test(codeVerifier)) {
    return false;
  }
  return sha256Base64Url(codeVerifier) === codeChallenge;
}

export default matchesCodeChallenge;
