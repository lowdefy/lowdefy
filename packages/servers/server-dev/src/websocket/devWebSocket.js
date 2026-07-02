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

import { randomUUID } from 'node:crypto';
import { createChannelRegistry, createWebSocketConnection } from '@lowdefy/api';

import app from '../app.js';

// One registry per dev server process, shared by all websocket connections.
const registry = createChannelRegistry();

// Contexts built by the /api/websocket route (full middleware chain) are
// handed to the upgrade handler through this exchange, keyed by request id.
const pendingContexts = new Map();

function setPendingWebSocketContext(rid, context) {
  pendingContexts.set(rid, context);
}

function takePendingWebSocketContext(rid) {
  const context = pendingContexts.get(rid);
  pendingContexts.delete(rid);
  return context;
}

// Called by the Vite plugin on an HTTP upgrade for /api/websocket. Runs the
// dev Hono app for the upgrade request (auth session + apiContext), then
// completes the websocket handshake and wires the connection to the registry.
async function handleWebSocketUpgrade({ request, socket, head, wss }) {
  const rid = randomUUID();
  const headers = new Headers();
  Object.entries(request.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });
  headers.set('x-lowdefy-websocket-rid', rid);

  const url = `http://${request.headers.host ?? 'localhost'}${request.url}`;
  const response = await app.fetch(new Request(url, { headers }));
  const context = takePendingWebSocketContext(rid);

  if (!context || response.status !== 200) {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    return;
  }

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

export { handleWebSocketUpgrade, setPendingWebSocketContext };
