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

import { routePath } from 'hono/route';
import { bindCredentialScrub } from '@lowdefy/node-utils';

import sentrySdk from '../../lib/server/sentry/sentrySdk.js';

// Sentry's Http integration starts each request's http.server span, in an isolation scope of the
// request's own, and names it by method alone until something names its route. Handler errors
// never propagate through middleware in Hono - captureException happens in the app error handler.
function sentryMiddleware() {
  return async function sentry(c, next) {
    const Sentry = sentrySdk.current;
    if (!Sentry) {
      return next();
    }
    // The request's spans and errors can be sent after its credential scope has ended (a span
    // ends once the response is written), so the scope's scrub rides on the request's isolation
    // scope to scrubEvent and scrubSpan.
    Sentry.getIsolationScope().setSDKProcessingMetadata({
      scrubRequestCredentials: bindCredentialScrub(),
    });
    await next();
    const activeSpan = Sentry.getActiveSpan();
    if (!activeSpan) {
      // Not tracing, or a request Sentry does not trace (HEAD, OPTIONS, a static file).
      return;
    }
    // Named by the route that answered, as registered (/api/endpoints/*), never by the request's
    // own path: Sentry sends the span's live name with each span after the scrub has run, so
    // nothing the client sent may be in it. After next(), Hono's route index is the handler
    // that answered. The request's path and query, scrubbed, are on the span's url attributes.
    const route = routePath(c);
    const rootSpan = Sentry.getRootSpan(activeSpan);
    Sentry.updateSpanName(rootSpan, `${c.req.method} ${route}`);
    rootSpan.setAttributes({
      'http.route': route,
      'sentry.segment.name.source': 'route',
    });
  };
}

export default sentryMiddleware;
