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

import { serve } from '@hono/node-server';
import { WebSocketServer } from 'ws';

import createApp from './app.js';

const app = createApp();
const port = Number(process.env.PORT ?? 3000);

const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });

const server = serve({ fetch: app.fetch, port, websocket: { server: wss } }, (info) => {
  console.log(`Lowdefy e2e server listening on http://localhost:${info.port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
