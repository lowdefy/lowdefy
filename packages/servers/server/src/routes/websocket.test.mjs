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
import { vi, afterAll, beforeAll, expect, test } from 'vitest';
import { serve } from '@hono/node-server';
import WebSocket, { WebSocketServer } from 'ws';

vi.doMock('../../lib/server/auth/getStrategies.js', () => ({
  default: () => [],
}));

const { default: websocketHandler } = await import('./websocket.js');

let server;
let port;

// The production wiring (src/index.js): a Hono app under the app's basePath,
// served by @hono/node-server with a ws server for upgrades. The Vercel
// function runs the same app through the same upgrade support.
beforeAll(async () => {
  const app = new Hono().basePath('/app');
  app.use('*', async (c, next) => {
    // The caller the upgrade resolved: signed in when the test says so.
    const signedIn = c.req.header('x-test-signed-in') === 'true';
    c.set('lowdefyContext', {
      // The auth engine finds no session for the socket's cookie on a re-check.
      auth: { api: { getSession: async () => null } },
      config: {},
      i18n: { active: 'en-US', messages: {} },
      rid: 'request',
      logger: { debug: () => {}, info: () => {}, warn: () => {} },
      handleError: () => {},
      user: signedIn ? { id: 'user-1', organization_id: 'org-1', roles: [] } : null,
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
  [
    'opens',
    'a proxy rewrote Host and passed X-Forwarded-Host',
    { host: 'localhost:3000', 'x-forwarded-host': 'app.test', origin: 'https://app.test' },
    'open',
  ],
])('a websocket upgrade %s when %s', async (_, __, headers, expected) => {
  expect(await open({ headers: { host: 'app.test', ...headers } })).toEqual(expected);
});

test('a websocket whose session ended closes with 4401 on its next subscribe', async () => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/app/api/websocket`, {
    headers: { host: 'app.test', 'x-test-signed-in': 'true' },
  });
  await new Promise((resolve) => socket.once('open', resolve));
  const closed = new Promise((resolve) => {
    socket.once('close', (code, reason) => resolve({ code, reason: reason.toString() }));
  });

  socket.send(JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' }));

  expect(await closed).toEqual({ code: 4401, reason: 'caller-changed' });
});
