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

// CORS for the routes an MCP App view calls (viewRoutes.cors), registered only
// for an app with a view. A view runs on its host's origin and signs in with a
// bearer session.
//
// Only the exact origins passed in are answered. The response names the one
// origin the request came from, never "*", and never allows credentials, so a
// cookie neither crosses nor is read. A request from any other origin gets no
// CORS header and the browser keeps the response from the page that sent it.
//
// Vary: Origin goes on every response, since the headers differ by origin.
// Headers are set after next() so a refusal, a 409 from refuseOtherBuild, an
// error and a timeout carry them too: without them the view cannot read why
// the call failed.
const ALLOW_METHODS = 'GET, POST';
const ALLOW_HEADERS = 'authorization, content-type, x-lowdefy-build';
const EXPOSE_HEADERS = 'x-lowdefy-caller';
const MAX_AGE_SECONDS = '600';

function viewCors({ origins }) {
  return async function viewCorsMiddleware(c, next) {
    const origin = c.req.header('origin');
    const allowed = origins.includes(origin);
    const preflight =
      c.req.method === 'OPTIONS' && c.req.header('access-control-request-method') !== undefined;
    if (allowed && preflight) {
      // Answered here: a preflight carries no credentials, so nothing below
      // needs to run for it.
      return c.body(null, 204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': ALLOW_METHODS,
        'Access-Control-Allow-Headers': ALLOW_HEADERS,
        'Access-Control-Max-Age': MAX_AGE_SECONDS,
        Vary: 'Origin',
      });
    }
    await next();
    c.header('Vary', 'Origin', { append: true });
    if (allowed) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Expose-Headers', EXPOSE_HEADERS);
    }
  };
}

export default viewCors;
