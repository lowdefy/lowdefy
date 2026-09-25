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
import { jest } from '@jest/globals';

const mockCreateWebSocketConnection = jest.fn(() => ({
  close: jest.fn(),
  handleMessage: jest.fn(),
}));
jest.unstable_mockModule('@lowdefy/api', () => ({
  createChannelRegistry: jest.fn(() => ({})),
  createWebSocketConnection: mockCreateWebSocketConnection,
}));
const mockLogger = { warn: jest.fn(), debug: jest.fn() };
jest.unstable_mockModule('../../lib/server/log/createLogger.js', () => ({
  default: () => mockLogger,
}));

const { handleWebSocketUpgrade } = await import('./devWebSocket.js');
const { default: websocketHandler } = await import('../routes/websocket.js');

// Mirrors the dev app: middleware builds the request context, then the
// websocket route runs. `status` stands in for the auth middleware refusing.
function createApp({ status } = {}) {
  const app = new Hono();
  app.use('/api/*', async (c, next) => {
    if (status) {
      return c.json({ message: 'Unauthorized.' }, status);
    }
    c.set('lowdefyContext', { rid: 'request-1', logger: mockLogger });
    return next();
  });
  app.get('/api/websocket', websocketHandler);
  return app;
}

function createUpgrade() {
  const socket = { end: jest.fn() };
  const ws = { on: jest.fn(), send: jest.fn() };
  const wss = { handleUpgrade: jest.fn((request, socket, head, callback) => callback(ws)) };
  const request = {
    headers: { host: 'localhost:3000', cookie: 'session=1' },
    url: '/api/websocket',
  };
  return { request, socket, wss, head: Buffer.alloc(0) };
}

test('an upgrade hands the context the route built to the websocket connection', async () => {
  const upgrade = createUpgrade();

  await handleWebSocketUpgrade({ app: createApp(), ...upgrade });

  expect(upgrade.wss.handleUpgrade).toHaveBeenCalledTimes(1);
  expect(mockCreateWebSocketConnection.mock.calls[0][0]).toEqual({
    rid: 'request-1',
    logger: mockLogger,
  });
  expect(upgrade.socket.end).not.toHaveBeenCalled();
});

test('concurrent upgrades through different app instances each get a connection', async () => {
  const first = createUpgrade();
  const second = createUpgrade();

  await Promise.all([
    handleWebSocketUpgrade({ app: createApp(), ...first }),
    handleWebSocketUpgrade({ app: createApp(), ...second }),
  ]);

  expect(mockCreateWebSocketConnection).toHaveBeenCalledTimes(2);
});

test('a refused upgrade answers with the route status and logs why', async () => {
  const upgrade = createUpgrade();

  await handleWebSocketUpgrade({ app: createApp({ status: 401 }), ...upgrade });

  expect(upgrade.wss.handleUpgrade).not.toHaveBeenCalled();
  expect(upgrade.socket.end).toHaveBeenCalledWith(
    'HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'
  );
  expect(mockLogger.warn).toHaveBeenCalledWith(
    { event: 'ws_upgrade_refused', status: 401 },
    'WebSocket upgrade refused: /api/websocket answered 401. {"message":"Unauthorized."}'
  );
});

test('the websocket route refuses a plain HTTP request', async () => {
  const response = await createApp().request('/api/websocket');

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message: 'WebSocket upgrade required.' });
});
