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

// The production wiring (src/index.js): a Hono app under the app's basePath,
// served by @hono/node-server with a ws server for upgrades. The Vercel
// function runs the same app through the same upgrade support.
beforeAll(async () => {
  const app = new Hono().basePath('/app');
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { rid: 'request', logger: { debug: () => {}, warn: () => {} } });
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
  ['the page is served from the same host', { host: 'app.test', origin: 'https://app.test' }],
  ['a client sends no origin', { host: 'app.test' }],
  [
    'a proxy passes the public host through',
    { host: 'app.example.com', origin: 'https://app.example.com' },
  ],
])('a websocket upgrade opens when %s', async (_, headers) => {
  expect(await open({ headers })).toEqual('open');
});

test.each([
  ['the origin is another site', { host: 'app.test', origin: 'https://other.test' }],
  ['the origin is a sibling subdomain', { host: 'app.test', origin: 'https://sub.app.test' }],
  [
    'the browser marks it cross-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'cross-site' },
  ],
])('a websocket upgrade is refused with 403 when %s', async (_, headers) => {
  expect(await open({ headers })).toEqual(403);
});
