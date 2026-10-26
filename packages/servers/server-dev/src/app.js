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
import { serveStatic } from '@hono/node-server/serve-static';
import { runInCredentialScope } from '@lowdefy/node-utils';

import agentHandler from './routes/agent.js';
import apiContext from './middleware/apiContext.js';
import authJson from '../lib/build/auth.js';
import authMiddleware from './routes/auth.js';
import clientErrorHandler from './routes/clientError.js';
import createErrorHandler from './middleware/errorHandler.js';
import createLogger from '../lib/server/log/createLogger.js';
import cronForwardHandler from './routes/cronForward.js';
import cronHandler from './routes/cron.js';
import detachedHandler from './routes/detached.js';
import devInspectHandler from './routes/devInspect.js';
import devRecordingHandler from './routes/devRecording.js';
import devToolsHandler from './routes/devTools.js';
import endpointsHandler from './routes/endpoints.js';
import getAuth from '../lib/server/auth/getAuth.js';
import getStrategies from '../lib/server/auth/getStrategies.js';
import getMockUser from '../lib/server/auth/getMockUser.js';
import jitPageHandler from './routes/jitPage.js';
import loadDocsRoutes from './routes/docs/loadDocsRoutes.js';
import localDevToolsOnly from './middleware/localDevToolsOnly.js';
import lowdefyConfig from '../lib/build/config.js';
import mcpHandler from './routes/mcp.js';
import mountDevPageRoutes from './routes/mountDevPageRoutes.js';
import mountOauthDiscovery from './routes/mountOauthDiscovery.js';
import noStore from './middleware/noStore.js';
import wellKnownFallbackHandler from './routes/wellKnownFallback.js';
import pingHandler from './routes/ping.js';
import reloadHandler from './routes/reload.js';
import renderDevPage from './html/renderDevPage.js';
import requestHandler from './routes/request.js';
import requestTimeout from './middleware/requestTimeout.js';
import rootHandler from './routes/root.js';
import staleFlag from './middleware/staleFlag.js';
import stampCaller from './middleware/stampCaller.js';
import startIdleGc from '../lib/server/startIdleGc.js';
import usageHandler from './routes/usage.js';
import userHandler from './routes/user.js';
import websocketHandler from './routes/websocket.js';

const basePath = lowdefyConfig.basePath ?? '';

// Same default as the production server, so a request that would time out in production (a 504
// the page shows as a generic error, beside the other requests' results) also times out in dev.
const requestTimeoutMs = lowdefyConfig.requestTimeout ?? 30000;

// A docs route handler that loads the docs routes on its first call.
function docsRoute(name) {
  return async function lazyDocsRoute(c, next) {
    const routes = await loadDocsRoutes();
    return routes[name](c, next);
  };
}

// Once the child has answered its first request (the manager's /api/ping
// readiness probe), the docs routes load and the docs index is built in the
// background, so neither delays start and the first doc search does not pay
// for reading every plugin and module's docs. A docs request made before then
// waits on the same load.
let docsWarmUpStarted = false;

function warmUpDocs() {
  loadDocsRoutes()
    .then((routes) => routes.getDocsIndex())
    .catch(() => {
      // Not kept: the next docs request loads again and answers with the error.
    });
}

function pingAndWarmUpDocs(c) {
  const response = pingHandler(c);
  if (!docsWarmUpStarted) {
    docsWarmUpStarted = true;
    setImmediate(warmUpDocs);
  }
  return response;
}

// Dev Hono app — mounted into Vite via @hono/vite-dev-server (Vite owns HTTP
// and serves /client/* modules with HMR; everything else lands here).
// No compression in dev (parity with the old next.config compress: false,
// and SSE must stay unbuffered).
function createApp() {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();
  const logger = createLogger({ server: 'lowdefy-dev' });

  // Each request runs in its own credential scope: what it marks with _credential is scrubbed
  // from every log line written while it is handled.
  app.use('*', (c, next) => runInCredentialScope(next));

  // No api context: SSE/health routes had no apiWrapper before.
  app.get('/api/reload', reloadHandler);
  app.get('/api/ping', pingAndWarmUpDocs);
  app.get('/api/dev-tools', devToolsHandler);

  const mockUser = getMockUser();
  if (authJson.configured === true && !mockUser) {
    // Construct the BetterAuth instance and strategy verifiers at startup so
    // config errors fail boot instead of the first request, and so the
    // process-memoized singletons capture the base logger rather than the
    // first request's rid-scoped child.
    getAuth({ logger });
    getStrategies({ logger });
  }

  mountOauthDiscovery({
    app,
    auth: authJson.configured === true && !mockUser ? getAuth({ logger }) : null,
  });
  app.all('/.well-known/*', wellKnownFallbackHandler);

  // Docs and MCP endpoint for AI coding agents — always on in dev. Serves
  // schemas/examples/docs for every installed plugin (core and local) plus
  // the extracted core docs (@lowdefy/docs-content). Mounted outside /api/*
  // so it can't clash with user API endpoints; /lowdefy-docs is a reserved page
  // prefix in dev. The handlers need no auth protection or api context —
  // they read build artifacts and node_modules directly.
  // The MCP transport is registered before staleFlag on purpose: hono
  // dispatches in registration order, so the stale middleware never sees a
  // JSON-RPC envelope. MCP carries its own stale notice, prepended to each
  // tool result in createDocsMcpServer — merging fields into the envelope
  // instead would put unknown members on a strictly-validated message.
  // localDevToolsOnly comes first of all: it refuses requests a browser sends
  // on behalf of another site. Registered twice because hono's `/*` pattern
  // does not match the bare path.
  app.use('/lowdefy-docs', localDevToolsOnly());
  app.use('/lowdefy-docs/*', localDevToolsOnly());
  app.all('/lowdefy-docs/mcp', docsRoute('mcp'));
  // Flags every other docs response while the last build failed. Registered
  // twice: hono's `/*` pattern does not match the bare path.
  app.use('/lowdefy-docs', staleFlag());
  app.use('/lowdefy-docs/*', staleFlag());
  app.get('/lowdefy-docs', docsRoute('index'));
  app.get('/lowdefy-docs/build-status', docsRoute('buildStatus'));
  // Push channel for non-MCP clients.
  app.get('/lowdefy-docs/events', docsRoute('events'));
  app.get('/lowdefy-docs/page-config/:pageId{.+}', docsRoute('pageConfig'));
  app.get('/lowdefy-docs/find/:id', docsRoute('find'));
  app.post('/lowdefy-docs/journey', docsRoute('journey'));
  app.post('/lowdefy-docs/mutants', docsRoute('mutants'));
  app.post('/lowdefy-docs/restart', docsRoute('restart'));
  // Live-tab inspection channel: dev tabs (client/Inspector.jsx) answer
  // targeted SSE events by posting results here; GET lists connected tabs.
  // The live-tab channel acts on the developer's open tabs - the same
  // cross-site guard as the docs tools.
  app.use('/api/dev-inspect', localDevToolsOnly());
  app.use('/api/dev-inspect/*', localDevToolsOnly());
  app.all('/api/dev-inspect', devInspectHandler);
  app.all('/api/dev-inspect/*', devInspectHandler);
  // The dev recorder (client/Recorder.jsx) posts interaction records here.
  // It needs no Lowdefy context, and registering it before apiContext keeps
  // it out of the request timeout list.
  app.use('/api/dev-recording', localDevToolsOnly());
  app.post('/api/dev-recording', bodyLimit({ maxSize: 1024 * 1024 }), devRecordingHandler);
  // Only the routes that run app logic: JIT page builds, the docs/MCP routes and the SSE streams
  // are dev-only and can legitimately run longer than any production request.
  if (requestTimeoutMs > 0) {
    const timeoutMiddleware = requestTimeout({ timeoutMs: requestTimeoutMs });
    [
      '/api/request/*',
      '/api/endpoints/*',
      '/api/cron/*',
      '/api/cron-forward/*',
      '/api/detached/*',
    ].forEach((route) => app.use(route, timeoutMiddleware));
  }

  app.use('/api/*', apiContext());
  // Responses that carry the caller's data are never stored by a browser or proxy cache,
  // as in the production server. /api/root is the dev form of the root config the
  // production page embeds. The page routes use the same middleware.
  const noStoreMiddleware = noStore();
  ['/api/root', '/api/page/*', '/api/user', '/api/request/*', '/api/endpoints/*'].forEach((route) =>
    app.use(route, noStoreMiddleware)
  );
  // Unified dev get-session: createLowdefyContext resolves the mock or headless
  // caller into context.user on every path, so read it here rather than
  // re-deriving the precedence. context.user is only absent in the real-engine
  // case (the developer's own browser), which must fall through to BetterAuth.
  // Registered before the /api/auth/* mount so this exact path wins while every
  // other auth route still reaches the engine.
  app.get('/api/auth/get-session', async (c, next) => {
    const context = c.get('lowdefyContext');
    if (context.user) return c.json({ session: { id: 'dev' }, user: context.user });
    return next();
  });
  app.use('/api/auth/*', authMiddleware({ logger }));
  // The caller each page, request and endpoint response was answered as: the
  // client reloads when it differs from the caller it renders (stampCaller).
  app.use('/api/request/*', stampCaller());
  app.use('/api/endpoints/*', stampCaller());
  app.use('/api/page/*', stampCaller());
  app.get('/api/root', rootHandler);
  app.get('/api/page/*', jitPageHandler);
  app.all('/api/request/*', requestHandler);
  // Endpoint payloads may carry base64 file content (emitFileContent + CallAPI);
  // cap bodies at 10 MiB to match the agent route.
  app.all('/api/endpoints/*', bodyLimit({ maxSize: 10 * 1024 * 1024 }), endpointsHandler);
  app.get('/api/cron/*', cronHandler);
  app.get('/api/cron-forward/*', cronForwardHandler);
  app.post('/api/detached/*', detachedHandler);
  app.all('/api/client-error', clientErrorHandler);
  app.all('/api/usage', usageHandler);
  app.all('/api/agent/*', bodyLimit({ maxSize: 10 * 1024 * 1024 }), agentHandler);
  app.all('/api/mcp', bodyLimit({ maxSize: 10 * 1024 * 1024 }), mcpHandler);
  app.get('/api/websocket', websocketHandler);
  app.get('/api/user', userHandler);

  // User public assets (icons, images). Vite serves /client modules itself.
  app.use(
    '/*',
    serveStatic({
      root: './public',
      rewriteRequestPath: basePath ? (path) => path.replace(basePath, '') : undefined,
    })
  );

  // Every page path renders the same shell — the client fetches config and
  // handles home/404 routing, exactly like the old dev pages router did.
  // The context middleware runs here too (mirroring the production server)
  // so the shell can inject the resolved caller — without it the client's
  // _user never carries roles/organization_id under `lowdefy dev`.
  app.use('/*', apiContext());
  // Registered after the static middleware, which answers a file without calling next().
  app.use('/*', noStoreMiddleware);
  mountDevPageRoutes({ app, renderPage: (c) => renderDevPage(c, { basePath }) });

  app.onError(createErrorHandler({ basePath, logger }));

  return app;
}

startIdleGc({ configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG });

export default createApp();
