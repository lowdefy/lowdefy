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
import { serve } from '@hono/node-server';
import WebSocket, { WebSocketServer } from 'ws';

import websocketHandler from './websocket.js';

let server;
let port;

// As src/index.js serves it: a Hono app under a basePath, with a ws server
// for upgrades.
beforeAll(async () => {
  const app = new Hono().basePath('/app');
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      config: {},
      rid: 'request',
      logger: { debug: () => {}, warn: () => {} },
    });
    await next();
  });
  app.get('/api/websocket', websocketHandler);
  const wss = new WebSocketServer({ noServer: true });
  await new Promise((resolve) => {
    server = serve({ fetch: app.fetch, port: 0, websocket: { server: wss } }, (info) => {
      port = info.port;
      resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

function open({ headers }) {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/app/api/websocket`, { headers });
    socket.once('open', () => {
      socket.close();
      resolve('open');
    });
    socket.once('unexpected-response', (_, response) => {
      socket.terminate();
      resolve(response.statusCode);
    });
    socket.once('error', () => {});
  });
}

test.each([
  ['opens', 'the page is served from the same host', { origin: 'https://app.test' }, 'open'],
  ['opens', 'a client sends no origin', {}, 'open'],
  ['is refused', 'the origin is another site', { origin: 'https://other.test' }, 403],
])('a websocket upgrade to the e2e server %s when %s', async (_, __, headers, expected) => {
  expect(await open({ headers: { host: 'app.test', ...headers } })).toEqual(expected);
});
