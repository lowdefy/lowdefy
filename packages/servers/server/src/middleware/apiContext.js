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

import fs from 'node:fs';
import path from 'node:path';
import { createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { v4 as uuid } from 'uuid';

import agents from '../../build/plugins/agents.js';
import appMeta from '../../lib/build/appMeta.js';
import blocksStatic from '../../build/plugins/blocksStatic.js';
import clientJsMap from '../../build/plugins/operators/clientJsMap.js';
import clientOperators from '../../build/plugins/operators/client.js';
import config from '../../lib/build/config.js';
import connections from '../../build/plugins/connections.js';
import { generateReport } from '../../build/plugins/reports.js';
import createHandleError from '../../lib/server/log/createHandleError.js';
import createLogger from '../../lib/server/log/createLogger.js';
import fileCache from '../../lib/server/fileCache.js';
import getSession from '../../lib/server/auth/session.js';
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
import websockets from '../../build/plugins/websockets.js';

const secrets = getSecretsFromEnv();

// Report generation artifacts, read once at startup. blockMetas drives the
// engine's category lookup; the report stylesheet sizes Html/chart renders; the
// public assets directory resolves relative image sources. The stylesheet is
// optional — an app without custom report styles has none.
const blockMetas = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'build/plugins/blockMetas.json'), 'utf8')
);

let reportStyles;
try {
  reportStyles = fs.readFileSync(path.join(process.cwd(), 'build/reports/styles.css'), 'utf8');
} catch {
  reportStyles = undefined;
}

// The Node server serves the built client and public assets from dist/client
// (Vite copies public/ into it), so relative image sources resolve there.
const publicDir = path.join(process.cwd(), 'dist/client');

const report = {
  blockMetas,
  generateReport,
  jsMap: clientJsMap,
  operators: clientOperators,
  publicDir,
  registry: blocksStatic,
  stylesheets: reportStyles,
};

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
    const context = {
      rid: getRequestId(c),
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
      notifications,
      operators,
      renderEmail,
      report,
      req: {
        url: c.req.path,
        method: c.req.method,
        hostname: c.req.header('host'),
      },
      secrets,
      // On Vercel (fluid compute) the platform request context keeps the
      // invocation alive until waitUntil promises settle; on long-lived hosts
      // the lookup resolves to nothing and background promises just run.
      waitUntil: (promise) =>
        globalThis[Symbol.for('@vercel/request-context')]?.get?.()?.waitUntil?.(promise),
      websockets,
    };
    context.logger = createLogger({ rid: context.rid });
    context.handleError = createHandleError({ context });
    if (!c.req.path.includes('/api/auth')) {
      context.session = await getSession(c);
      // Set Sentry user context for authenticated requests
      setSentryUser({
        user: context.session?.user,
        sentryConfig: loggerConfig.sentry,
      });
    }
    createApiContext(context);
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
