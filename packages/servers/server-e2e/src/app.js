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
import { compress } from 'hono/compress';
import { serveStatic } from '@hono/node-server/serve-static';

import apiContext from './middleware/apiContext.js';
import apiPageHandler from './routes/apiPage.js';
import clientErrorHandler from './routes/clientError.js';
import createErrorHandler from './middleware/errorHandler.js';
import createLogger from '../lib/server/log/createLogger.js';
import endpointsHandler from './routes/endpoints.js';
import lowdefyConfig from '../lib/build/config.js';
import renderPage from './html/renderPage.js';
import requestHandler from './routes/request.js';
import sessionMockHandler from './routes/sessionMock.js';
import usageHandler from './routes/usage.js';
import websocketHandler from './routes/websocket.js';

const basePath = lowdefyConfig.basePath ?? '';

function createApp() {
  const app = basePath ? new Hono().basePath(basePath) : new Hono();
  const logger = createLogger({ server: 'lowdefy' });

  app.use('*', async (c, next) => {
    if (c.req.path.includes('/api/websocket')) {
      return next();
    }
    return compress()(c, next);
  });

  app.use('/api/*', apiContext());
  // Mock session endpoint — reads the lowdefy_e2e_user cookie; also the
  // e2e harness health check (e2e-utils polls /api/auth/session).
  app.get('/api/auth/session', sessionMockHandler);
  app.all('/api/request/*', requestHandler);
  app.all('/api/endpoints/*', endpointsHandler);
  app.all('/api/client-error', clientErrorHandler);
  app.all('/api/usage', usageHandler);
  app.get('/api/websocket', websocketHandler);
  app.get('/api/page/*', apiPageHandler);

  // Vite build output (includes public/ via Vite's publicDir copy). Falls
  // through to the page routes when no file matches.
  app.use(
    '/*',
    serveStatic({
      root: './dist/client',
      rewriteRequestPath: basePath ? (path) => path.replace(basePath, '') : undefined,
    })
  );

  app.use('/*', apiContext());
  app.get('/', (c) => renderPage(c, { pageId: '' }));
  app.get('/404', (c) => renderPage(c, { pageId: '404', status: 404 }));
  app.get('/:rest{.+}', (c) => renderPage(c, { pageId: c.req.param('rest') }));

  app.onError(createErrorHandler({ basePath, logger }));

  return app;
}

export default createApp;
