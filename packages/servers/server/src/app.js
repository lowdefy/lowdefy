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

import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { timeout } from 'hono/timeout';
import { serveStatic } from '@hono/node-server/serve-static';

import agentHandler from './routes/agent.js';
import apiContext from './middleware/apiContext.js';
import apiPageHandler from './routes/apiPage.js';
import authJson from '../lib/build/auth.js';
import authMiddleware from './routes/auth.js';
import clientErrorHandler from './routes/clientError.js';
import createErrorHandler from './middleware/errorHandler.js';
import createLogger from '../lib/server/log/createLogger.js';
import cronHandler from './routes/cron.js';
import detachedHandler from './routes/detached.js';
import endpointsHandler from './routes/endpoints.js';
import getAuth from '../lib/server/auth/getAuth.js';
import getStrategies from '../lib/server/auth/getStrategies.js';
import lowdefyConfig from '../lib/build/config.js';
import mcpHandler from './routes/mcp.js';
import mountOauthDiscovery from './routes/mountOauthDiscovery.js';
import wellKnownFallbackHandler from './routes/wellKnownFallback.js';
import renderPage from './html/renderPage.js';
import requestHandler from './routes/request.js';
import sentryMiddleware from './middleware/sentry.js';
import usageHandler from './routes/usage.js';
import userHandler from './routes/user.js';
import websocketHandler from './routes/websocket.js';

const basePath = lowdefyConfig.basePath ?? '';

// Cap how long a single request may run. A request that hangs on an upstream call (DB, SMTP, an
// external API) would otherwise run to the platform's function limit — on serverless (e.g. Vercel
// Fluid) that is billed compute. Configured via `config.requestTimeout` (ms) in lowdefy.yaml;
// defaults to 30s, 0 disables. Agent streaming is exempt below since it is long-lived by design.
const requestTimeoutMs = lowdefyConfig.requestTimeout ?? 30000;

// `serveStaticAssets` is true for the Node server (it serves `dist/client` itself). On a
// platform that serves the built client + public files from a CDN (e.g. Vercel), pass false so
// the request handler skips the Node-only static middleware and only owns the dynamic routes.
function createApp({ serveStaticAssets = true } = {}) {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();
  const logger = createLogger({ server: 'lowdefy' });

  // Liveness endpoint for container health checks and orchestrator probes. Registered
  // before all middleware so probes skip auth, session, request logging, and Sentry.
  app.get('/api/lowdefy-health', (c) => c.json({ status: 'ok' }));

  app.use('*', sentryMiddleware());

  // Bound request duration so a hung upstream returns an error instead of running to the platform's
  // function limit (cost protection on serverless). Agent streaming is long-lived by design, so it
  // is exempt. Configured via `config.requestTimeout` in lowdefy.yaml (0 disables).
  if (requestTimeoutMs > 0) {
    app.use('*', async (c, next) => {
      if (
        c.req.path.includes('/api/agent/') ||
        c.req.path.includes('/api/mcp') ||
        c.req.path.includes('/api/websocket')
      ) {
        return next();
      }
      return timeout(requestTimeoutMs)(c, next);
    });
  }

  // Next.js compressed responses by default — keep parity, but leave
  // streaming responses (agent SSE) and websocket upgrades uncompressed.
  app.use('*', async (c, next) => {
    if (
      c.req.path.includes('/api/agent/') ||
      c.req.path.includes('/api/mcp') ||
      c.req.path.includes('/api/websocket')
    ) {
      return next();
    }
    return compress()(c, next);
  });

  if (authJson.configured === true) {
    // Construct the BetterAuth instance and strategy verifiers at startup so
    // config errors fail boot instead of the first request, and so the
    // process-memoized singletons capture the base logger rather than the
    // first request's rid-scoped child.
    getAuth({ logger });
    getStrategies({ logger });
  }

  mountOauthDiscovery({
    app,
    auth: authJson.configured === true ? getAuth({ logger }) : null,
  });
  app.all('/.well-known/*', wellKnownFallbackHandler);

  app.use('/api/*', apiContext());
  app.use('/api/auth/*', authMiddleware({ logger }));
  app.all('/api/request/*', requestHandler);
  // Endpoint payloads may carry base64 file content (emitFileContent + CallAPI);
  // cap bodies at 10 MiB to match the agent route.
  app.all('/api/endpoints/*', bodyLimit({ maxSize: 10 * 1024 * 1024 }), endpointsHandler);
  app.get('/api/cron/*', cronHandler);
  app.post('/api/detached/*', detachedHandler);
  app.all('/api/client-error', clientErrorHandler);
  app.all('/api/usage', usageHandler);
  app.all('/api/agent/*', bodyLimit({ maxSize: 10 * 1024 * 1024 }), agentHandler);
  app.all('/api/mcp', bodyLimit({ maxSize: 10 * 1024 * 1024 }), mcpHandler);
  app.get('/api/websocket', websocketHandler);
  app.get('/api/page/*', apiPageHandler);
  app.get('/api/user', userHandler);

  // Vite build output (includes public/ via Vite's publicDir copy). Falls
  // through to the page routes when no file matches.
  if (serveStaticAssets) {
    app.use(
      '/*',
      serveStatic({
        root: './dist/client',
        rewriteRequestPath: basePath ? (path) => path.replace(basePath, '') : undefined,
      })
    );
  }

  app.use('/*', apiContext());
  app.get('/', (c) => renderPage(c, { pageId: '' }));
  app.get('/404', (c) => renderPage(c, { pageId: '404', status: 404 }));
  app.get('/:rest{.+}', (c) => renderPage(c, { pageId: c.req.param('rest') }));

  app.onError(createErrorHandler({ basePath, logger }));

  return app;
}

export default createApp;
