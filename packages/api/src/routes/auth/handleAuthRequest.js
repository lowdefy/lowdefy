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

// BetterAuth reads the client address (its rate-limit key, the session's
// ipAddress, the captcha remote IP) only from request headers. The server
// resolves the address itself - from the connection and the app's trusted
// proxies - and hands it over in this header, which getBetterAuthConfig names
// as the one BetterAuth reads. Any copy the client sent is replaced, so the
// header carries only what the server resolved.
const CLIENT_ADDRESS_HEADER = 'x-lowdefy-client-address';

// The new Request is built from the incoming one's parts rather than cloned
// from it: @hono/node-server hands the app a lightweight stand-in for a
// Request, which only its own copy's Request constructor accepts as input,
// and the dev server loads two copies.
function handleAuthRequest({ auth, request, clientAddress }) {
  const headers = new Headers(request.headers);
  headers.delete(CLIENT_ADDRESS_HEADER);
  if (!type.isNone(clientAddress)) {
    headers.set(CLIENT_ADDRESS_HEADER, clientAddress);
  }
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return auth.handler(
    new Request(request.url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : null,
      duplex: 'half',
      signal: request.signal,
    })
  );
}

export default handleAuthRequest;
export { CLIENT_ADDRESS_HEADER };
