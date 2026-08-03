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

import path from 'node:path';
import {
  createApiContext,
  resolveAuthentication,
  resolvePinnedOrganization,
  resolveTenantPreflight,
} from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../../lib/build/appMeta.js';
import config from '../../lib/build/config.js';
import connections from '../../build/plugins/connections.js';
import createHandleError from '../../lib/server/log/createHandleError.js';
import createLogger from '../../lib/server/log/createLogger.js';
import fileCache from '../../lib/server/fileCache.js';
import getAuth from '../../lib/server/auth/getAuth.js';
import getStrategies from '../../lib/server/auth/getStrategies.js';
import i18nConfig from '../../lib/build/i18n.js';
import jsMap from '../../build/plugins/operators/serverJsMap.js';
import logRequest from '../../lib/server/log/logRequest.js';
import loggerConfig from '../../lib/build/logger.js';
import notifications, {
  interpolateProperties,
  renderEmail,
} from '../../build/plugins/notifications.js';
import operators from '../../build/plugins/operators/server.js';
import setSentryUser from '../../lib/server/sentry/setSentryUser.js';
import steps from '../../build/plugins/steps.js';
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Charset/length guard so a hostile x-request-id can't inject into logs.
const REQUEST_ID_REGEX = /^[\w.:-]{1,128}$/;

// Honor the request id assigned by an upstream proxy or load balancer so one
// id correlates client, proxy, and server logs; generate one otherwise.
function getRequestId(c) {
  const incoming = c.req.header('x-request-id');
  if (incoming && REQUEST_ID_REGEX.test(incoming)) {
    return incoming;
  }
  return uuid();
}

// Replaces lib/server/apiWrapper.js. Builds the request context consumed by
// @lowdefy/api functions. Errors thrown by handlers are routed by Hono to the
// app-level error handler (src/middleware/errorHandler.js), which reads this
// context back from the Hono context.
function apiContext() {
  return async function apiContextMiddleware(c, next) {
    // The page-route mount ('/*') also matches /api/* paths that already
    // built a context — never build twice for one request.
    if (c.get('lowdefyContext')) {
      return next();
    }
    const rid = getRequestId(c);
    const context = {
      rid,
      agents,
      appMeta,
      buildDirectory: path.join(process.cwd(), 'build'),
      config,
      connections,
      fileCache,
      headers: c.req.header(),
      // The deployment's own origin — detached endpoint calls loop back
      // through it so the target runs in its own function invocation.
      origin: new URL(c.req.url).origin,
      i18n: i18nConfig,
      interpolateProperties,
      jsMap,
      logger: createLogger({ rid }),
      notifications,
      operators,
      renderEmail,
      req: {
        url: c.req.path,
        method: c.req.method,
        hostname: c.req.header('host'),
      },
      secrets,
      steps,
      // On Vercel (fluid compute) the platform request context keeps the
      // invocation alive until waitUntil promises settle; on long-lived hosts
      // the lookup resolves to nothing and background promises just run.
      waitUntil: (promise) =>
        globalThis[Symbol.for('@vercel/request-context')]?.get?.()?.waitUntil?.(promise),
      websockets,
    };
    context.handleError = createHandleError({ context });
    // Hoisted once per request - resolveAuthentication also needs it, and
    // getBetterAuth memoizes the instance, but this keeps the auth engine
    // construction to a single call site per request.
    context.auth = getAuth({ logger: context.logger });
    // The engine is constructed lazily on the first request, which would
    // otherwise race the startup pinned-org ensure - await the memoized
    // resolve so createApiContext reads a retained binding.
    await resolvePinnedOrganization({ auth: context.auth, logger: context.logger });
    if (!c.req.path.includes('/api/auth')) {
      // resolveAuthentication is the single writer of context.user.
      await resolveAuthentication(context, {
        auth: context.auth,
        headers: c.req.raw.headers,
        strategies: getStrategies({ logger: context.logger }),
      });
      // Set Sentry user context for authenticated requests
      setSentryUser({
        user: context.user,
        sentryConfig: loggerConfig.sentry,
      });
    }
    createApiContext(context);
    // Under policy: tenant, refuse to serve while walled collections hold
    // unstamped rows (lazily-run-once; a refusal memoizes until restart, a
    // probe failure retries next request). No-op under pinned.
    await resolveTenantPreflight(context);
    c.set('lowdefyContext', context);
    // Echo the request id so clients and proxies can quote it when reporting
    // a failure, and it can be matched to the rid on the server log lines.
    c.header('x-request-id', context.rid);
    const startTime = performance.now();
    // Handler errors never reject next() — Hono's compose routes them to the
    // app-level error handler at the throwing dispatch level, so by the time
    // next() resolves c.res holds the final response, error or not.
    await next();
    logRequest({
      context,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startTime),
    });
  };
}

export default apiContext;
