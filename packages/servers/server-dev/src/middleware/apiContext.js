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

import createLowdefyContext from '../../lib/server/createLowdefyContext.js';

// Replaces lib/server/apiWrapper.js. Errors thrown by handlers are routed by
// Hono to the app-level error handler (src/middleware/errorHandler.js).
function apiContext() {
  return async function apiContextMiddleware(c, next) {
    if (c.get('lowdefyContext')) {
      return next();
    }
    const context = await createLowdefyContext({ c });
    c.set('lowdefyContext', context);
    return next();
  };
}

export default apiContext;
