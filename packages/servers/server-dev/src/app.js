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

import agentHandler from './routes/agent.js';
import apiContext from './middleware/apiContext.js';
import authJson from '../lib/build/auth.js';
import authMiddleware from './routes/auth.js';
import clientErrorHandler from './routes/clientError.js';
import createErrorHandler from './middleware/errorHandler.js';
import createLogger from '../lib/server/log/createLogger.js';
import cronHandler from './routes/cron.js';
import detachedHandler from './routes/detached.js';
import devInspectHandler from './routes/devInspect.js';
import devToolsHandler from './routes/devTools.js';
import feedbackHandler from './routes/feedback.js';
import docsAppMapHandler from './routes/docs/appMap.js';
import docsBuildStatusHandler from './routes/docs/buildStatus.js';
import docsCheckpointsCreateHandler from './routes/docs/checkpointsCreate.js';
import docsCheckpointsListHandler from './routes/docs/checkpointsList.js';
import docsCheckpointsRevertHandler from './routes/docs/checkpointsRevert.js';
import docsContentHandler from './routes/docs/content.js';
import docsEvalOperatorHandler from './routes/docs/evalOperator.js';
import docsEventsHandler from './routes/docs/events.js';
import docsExamplesHandler from './routes/docs/examples.js';
import docsFindHandler from './routes/docs/find.js';
import docsIndexHandler from './routes/docs/index.js';
import docsInspectStateHandler from './routes/docs/inspectState.js';
import docsLoadStateHandler from './routes/docs/loadState.js';
import docsMcpHandler from './routes/docs/mcp.js';
import docsPageConfigHandler from './routes/docs/pageConfig.js';
import docsRestartHandler from './routes/docs/restart.js';
import docsRunEndpointHandler from './routes/docs/runEndpoint.js';
import docsRunRequestHandler from './routes/docs/runRequest.js';
import docsSnapshotStateHandler from './routes/docs/snapshotState.js';
import docsStateCheckpointsListHandler from './routes/docs/stateCheckpointsList.js';
import docsPluginDocHandler from './routes/docs/pluginDoc.js';
import docsPluginsHandler from './routes/docs/plugins.js';
import docsSchemaHandler from './routes/docs/schema.js';
import docsScreenshotHandler from './routes/docs/screenshot.js';
import docsSearchHandler from './routes/docs/search.js';
import docsTypesHandler from './routes/docs/types.js';
import endpointsHandler from './routes/endpoints.js';
import getAuth from '../lib/server/auth/getAuth.js';
import getStrategies from '../lib/server/auth/getStrategies.js';
import getMockUser from '../lib/server/auth/getMockUser.js';
import jitPageHandler from './routes/jitPage.js';
import lowdefyConfig from '../lib/build/config.js';
import mcpHandler from './routes/mcp.js';
import mountOauthDiscovery from './routes/mountOauthDiscovery.js';
import wellKnownFallbackHandler from './routes/wellKnownFallback.js';
import pingHandler from './routes/ping.js';
import reloadHandler from './routes/reload.js';
import renderDevPage from './html/renderDevPage.js';
import requestHandler from './routes/request.js';
import rootHandler from './routes/root.js';
import staleFlag from './middleware/staleFlag.js';
import usageHandler from './routes/usage.js';
import userHandler from './routes/user.js';
import websocketHandler from './routes/websocket.js';

const basePath = lowdefyConfig.basePath ?? '';

// Dev Hono app — mounted into Vite via @hono/vite-dev-server (Vite owns HTTP
// and serves /client/* modules with HMR; everything else lands here).
// No compression in dev (parity with the old next.config compress: false,
// and SSE must stay unbuffered).
function createApp() {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();
  const logger = createLogger({ server: 'lowdefy-dev' });

  // No api context: SSE/health routes had no apiWrapper before.
  app.get('/api/reload', reloadHandler);
  app.get('/api/ping', pingHandler);
  app.get('/api/dev-tools', devToolsHandler);
  // Annotation helper: the in-page overlay (Cmd/Ctrl+/) POSTs annotation
  // batches here and gets back the enriched agent-readable text, which the
  // overlay copies to the clipboard. No api context needed.
  // /lowdefy-feedback is a reserved page-path prefix in dev, like /lowdefy-docs.
  app.post('/lowdefy-feedback', feedbackHandler);

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
  // they read build artifacts and node_modules directly — but run-request,
  // run-endpoint and eval-operator build a full Lowdefy context (createLowdefyContext),
  // which resolves the caller from the request headers via resolveAuthentication.
  // The MCP transport is registered before staleFlag on purpose: hono
  // dispatches in registration order, so the stale middleware never sees a
  // JSON-RPC envelope. MCP carries its own stale notice, prepended to each
  // tool result in createDocsMcpServer — merging fields into the envelope
  // instead would put unknown members on a strictly-validated message.
  app.all('/lowdefy-docs/mcp', docsMcpHandler);
  // Flags every other docs response while the last build failed. Registered
  // twice: hono's `/*` pattern does not match the bare path.
  app.use('/lowdefy-docs', staleFlag());
  app.use('/lowdefy-docs/*', staleFlag());
  app.get('/lowdefy-docs', docsIndexHandler);
  app.get('/lowdefy-docs/build-status', docsBuildStatusHandler);
  // Push channel for non-MCP clients. Must sit above the `/lowdefy-docs/:kind`
  // catch-all, which would otherwise treat "events" as a type kind.
  app.get('/lowdefy-docs/events', docsEventsHandler);
  app.get('/lowdefy-docs/page-config/:pageId', docsPageConfigHandler);
  app.get('/lowdefy-docs/find/:id', docsFindHandler);
  app.get('/lowdefy-docs/screenshot/:pageId', docsScreenshotHandler);
  app.get('/lowdefy-docs/inspect-state/:pageId', docsInspectStateHandler);
  app.post('/lowdefy-docs/eval-operator', docsEvalOperatorHandler);
  app.post('/lowdefy-docs/run-request', docsRunRequestHandler);
  app.post('/lowdefy-docs/run-endpoint', docsRunEndpointHandler);
  app.get('/lowdefy-docs/app-map', docsAppMapHandler);
  app.get('/lowdefy-docs/checkpoints', docsCheckpointsListHandler);
  app.post('/lowdefy-docs/checkpoints', docsCheckpointsCreateHandler);
  app.post('/lowdefy-docs/checkpoints/revert', docsCheckpointsRevertHandler);
  app.get('/lowdefy-docs/state-checkpoints', docsStateCheckpointsListHandler);
  app.post('/lowdefy-docs/state-checkpoints/snapshot', docsSnapshotStateHandler);
  app.post('/lowdefy-docs/state-checkpoints/load', docsLoadStateHandler);
  app.post('/lowdefy-docs/restart', docsRestartHandler);
  // Live-tab inspection channel: dev tabs (client/Inspector.jsx) answer
  // targeted SSE events by posting results here; GET lists connected tabs
  // and serves checkpoint parts for the ?_checkpoint bootstrap.
  app.all('/api/dev-inspect', devInspectHandler);
  app.all('/api/dev-inspect/*', devInspectHandler);
  app.get('/lowdefy-docs/plugins', docsPluginsHandler);
  app.get('/lowdefy-docs/schema/:kind/:type', docsSchemaHandler);
  app.get('/lowdefy-docs/examples/:type', docsExamplesHandler);
  app.get('/lowdefy-docs/search', docsSearchHandler);
  app.get('/lowdefy-docs/plugin-doc/:package{.+}', docsPluginDocHandler);
  app.get('/lowdefy-docs/content/:slug{.+}', docsContentHandler);
  app.get('/lowdefy-docs/:kind', docsTypesHandler);

  app.use('/api/*', apiContext());
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
  app.get('/api/root', rootHandler);
  app.get('/api/page/*', jitPageHandler);
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
  app.get('/', (c) => renderDevPage(c, { basePath }));
  app.get('/:rest{.+}', (c) => renderDevPage(c, { basePath }));

  app.onError(createErrorHandler({ basePath, logger }));

  return app;
}

export default createApp();
