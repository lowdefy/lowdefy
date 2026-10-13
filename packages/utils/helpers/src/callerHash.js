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

import type from './type.js';

// A short fingerprint of the caller a response was answered as, sent by the
// server on page, request and endpoint responses and compared by the client
// with the caller it renders. The user id and active organization together, so
// a switched organization reads as another caller. Empty for an anonymous
// caller. Async: it uses WebCrypto, the one SHA-256 both Node and the browser
// carry.
async function callerHash({ user }) {
  if (type.isNone(user)) {
    return '';
  }
  const text = `${user.id}:${user.organization_id ?? ''}`;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export default callerHash;
