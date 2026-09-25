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

import { STATUS_CODES } from 'node:http';
import { createChannelRegistry, createWebSocketConnection } from '@lowdefy/api';

import createLogger from '../../lib/server/log/createLogger.js';

const logger = createLogger();

// One registry per dev server process, shared by all websocket connections.
const registry = createChannelRegistry();

// Called by the Vite plugin (see vite.config.js) on an HTTP upgrade for
// /api/websocket, with the dev Hono app. Runs the app for the upgrade request
// (auth session + apiContext) and receives the request context through the
// websocketUpgrade object in the Hono env, then completes the websocket
// handshake and wires the connection to the registry. The context travels
// with the request, not through state shared between modules, so the upgrade
// works however Vite has re-evaluated the app's modules after a rebuild.
async function handleWebSocketUpgrade({ app, request, socket, head, wss }) {
  const headers = new Headers();
  Object.entries(request.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  const url = `http://${request.headers.host ?? 'localhost'}${request.url}`;
  const websocketUpgrade = { context: null };
  const response = await app.fetch(new Request(url, { headers }), { websocketUpgrade });

  if (response.status !== 200) {
    const body = await response.text();
    logger.warn(
      { event: 'ws_upgrade_refused', status: response.status },
      `WebSocket upgrade refused: ${request.url} answered ${response.status}. ${body}`
    );
    socket.end(
      `HTTP/1.1 ${response.status} ${STATUS_CODES[response.status]}\r\nConnection: close\r\n\r\n`
    );
    return;
  }

  const { context } = websocketUpgrade;
  wss.handleUpgrade(request, socket, head, (ws) => {
    const connection = createWebSocketConnection(context, {
      registry,
      send: (message) => ws.send(message),
    });
    ws.on('message', (data) => {
      connection.handleMessage(data.toString());
    });
    ws.on('close', () => {
      connection.close();
    });
    ws.on('error', (error) => {
      context.logger.debug({ event: 'ws_error' }, String(error?.message ?? error));
    });
  });
}

export { handleWebSocketUpgrade };
