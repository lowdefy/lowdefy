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

const TOKEN_STORE_METHODS = ['get', 'set', 'clear'];

// How the host signs its calls in. A browser host sends the session cookie
// itself ('cookie', also when the host names none). A native shell has no
// cookie jar, so it holds the Better Auth session token and sends it as
// `Authorization: Bearer` ('bearer'), keeping the token in tokenStore:
// { get() the token held in memory or null, set(token), clear() }. get is
// synchronous, since a websocket opens synchronously; set and clear may return
// promises, which the core awaits.
function validateAuthTransport({ host }) {
  const { authTransport, tokenStore } = host;
  if (type.isUndefined(authTransport) || authTransport === 'cookie') {
    return;
  }
  if (authTransport !== 'bearer') {
    throw new Error(
      `Lowdefy client host authTransport must be "cookie" or "bearer". Received ${JSON.stringify(
        authTransport
      )}.`
    );
  }
  const missing = TOKEN_STORE_METHODS.filter((method) => !type.isFunction(tokenStore?.[method]));
  if (missing.length > 0) {
    throw new Error(
      `Lowdefy client host with authTransport "bearer" needs a tokenStore with ${missing.join(
        ', '
      )}.`
    );
  }
}

export default validateAuthTransport;
