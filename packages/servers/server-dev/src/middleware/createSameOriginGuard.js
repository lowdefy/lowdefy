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

import { isSameOriginRequest } from '@lowdefy/api';

// The cross-site defence for the routes only this app's own pages call
// (/api/client-error, /api/feedback, /api/websocket) and for the dev tools.
// The rule itself - Sec-Fetch-Site, then Origin against Host - is
// isSameOriginRequest in @lowdefy/api, which every server shares.
function createSameOriginGuard({ allowNoOrigin = false } = {}) {
  // Returns the 403 response to answer with, or null when the request may
  // proceed. A guard, not Hono middleware, so a route keeps one entry point
  // and the refusal is visible at the top of the handler that owns it.
  return function guardSameOrigin(c) {
    if (isSameOriginRequest({ getHeader: (name) => c.req.header(name), allowNoOrigin })) {
      return null;
    }
    return c.json({ error: 'Forbidden' }, 403);
  };
}

export default createSameOriginGuard;
