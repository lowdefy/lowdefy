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

import readViewSocketToken from './readViewSocketToken.js';

// The headers a request's caller is resolved from. They are the request's own,
// except on a websocket handshake from a view, whose bearer session arrives as
// a subprotocol (readViewSocketToken): it is set as the Authorization header
// the bearer plugin reads, so a view's socket resolves the way a phone
// shell's does. A handshake that already carries Authorization keeps it.
function getAuthenticationHeaders(c) {
  const requestHeaders = c.req.raw.headers;
  if (!c.req.path.endsWith('/api/websocket') || requestHeaders.has('authorization')) {
    return requestHeaders;
  }
  const token = readViewSocketToken({ header: c.req.header('sec-websocket-protocol') });
  if (token === null) {
    return requestHeaders;
  }
  const headers = new Headers(requestHeaders);
  headers.set('authorization', `Bearer ${token}`);
  return headers;
}

export default getAuthenticationHeaders;
