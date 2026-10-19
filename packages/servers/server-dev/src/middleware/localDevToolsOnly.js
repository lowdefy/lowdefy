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

import createSameOriginGuard from './createSameOriginGuard.js';

// The dev tools under /lowdefy-docs run requests, endpoints and journeys
// against real connections, and several accept a CORS-simple request (a
// text/plain POST, a GET with query parameters) - so without this any website
// the developer visits could drive them. The guard refuses a request a
// browser marks cross-site or same-site, and one whose Origin is not this
// server. Agents and curl send neither header and pass. DNS rebinding never
// reaches here: Vite's host check refuses a Host that is not local first.
const guardSameOrigin = createSameOriginGuard({ allowNoOrigin: true });

function localDevToolsOnly() {
  return async function localDevToolsOnlyMiddleware(c, next) {
    const refusal = guardSameOrigin(c);
    if (refusal !== null) {
      return refusal;
    }
    await next();
  };
}

export default localDevToolsOnly;
