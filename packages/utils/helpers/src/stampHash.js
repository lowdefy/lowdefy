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

import sha256Hex from './sha256Hex.js';

// A short fingerprint for one part of a response's caller stamp (see
// callerStamp): the first 16 hex characters of SHA-256 of the text. It is an
// identity comparison, not a secret: SHA-256 is implemented in sha256Hex rather
// than taken from WebCrypto, which browsers expose only on https and localhost
// pages, so the server and every page compute the same value synchronously.
function stampHash(text) {
  return sha256Hex(text).slice(0, 16);
}

export default stampHash;
