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
import { initAuthConfig } from '@hono/auth-js';
import { serveStatic } from '@hono/node-server/serve-static';

import agentHandler from './routes/agent.js';
import apiContext from './middleware/apiContext.js';
import authJson from '../lib/build/auth.js';
import authMiddleware from './routes/auth.js';
import clientErrorHandler from './routes/clientError.js';
import createErrorHandler from './middleware/errorHandler.js';
import createLogger from '../lib/server/log/createLogger.js';
import cronHandler from './routes/cron.js';
import devToolsHandler from './routes/devTools.js';
import endpointsHandler from './routes/endpoints.js';
import getAuthConfig from '../lib/server/auth/getAuthConfig.js';
import iconsDynamicHandler from './routes/iconsDynamic.js';
import jitPageHandler from './routes/jitPage.js';
import jsEnvHandler from './routes/jsEnv.js';
import lowdefyConfig from '../lib/build/config.js';
import pingHandler from './routes/ping.js';
import reloadHandler from './routes/reload.js';
import renderDevPage from './html/renderDevPage.js';
import requestHandler from './routes/request.js';
import rootHandler from './routes/root.js';
import usageHandler from './routes/usage.js';
import websocketHandler from './routes/websocket.js';

const basePath = lowdefyConfig.basePath ?? '';

// Dev Hono app — mounted into Vite via @hono/vite-dev-server (Vite owns HTTP
// and serves /client/* modules with HMR; everything else lands here).
// No compression in dev (parity with the old next.config compress: false,
// and SSE must stay unbuffered).
function createApp() {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();
  const logger = createLogger({ server: 'lowdefy-dev' });

  // No api context: SSE/health/static-js routes had no apiWrapper before.
  app.get('/api/reload', reloadHandler);
  app.get('/api/ping', pingHandler);
  app.get('/api/js/:env', jsEnvHandler);
  app.get('/api/icons/dynamic', iconsDynamicHandler);
  app.get('/api/dev-tools', devToolsHandler);

  if (authJson.configured === true) {
    app.use(
      '*',
      initAuthConfig(() => getAuthConfig({ logger }))
    );
  }

  app.use('/api/*', apiContext());
  app.use('/api/auth/*', authMiddleware());
  app.get('/api/root', rootHandler);
  app.get('/api/page/*', jitPageHandler);
  app.all('/api/request/*', requestHandler);
  app.all('/api/endpoints/*', endpointsHandler);
  app.get('/api/cron/*', cronHandler);
  app.all('/api/client-error', clientErrorHandler);
  app.all('/api/usage', usageHandler);
  app.all('/api/agent/*', bodyLimit({ maxSize: 10 * 1024 * 1024 }), agentHandler);
  app.get('/api/websocket', websocketHandler);

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
  app.get('/', (c) => renderDevPage(c, { basePath }));
  app.get('/:rest{.+}', (c) => renderDevPage(c, { basePath }));

  app.onError(createErrorHandler({ basePath, logger }));

  return app;
}

export default createApp();
