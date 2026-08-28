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

import * as Sentry from '@sentry/node';

// Replaces @sentry/nextjs route auto-instrumentation: every request becomes
// an http.server transaction. Handler errors never propagate through
// middleware in Hono — captureException happens in the app error handler.
function sentryMiddleware() {
  return async function sentry(c, next) {
    if (!process.env.SENTRY_DSN) {
      return next();
    }
    return Sentry.startSpan({ name: `${c.req.method} ${c.req.path}`, op: 'http.server' }, () =>
      next()
    );
  };
}

export default sentryMiddleware;
