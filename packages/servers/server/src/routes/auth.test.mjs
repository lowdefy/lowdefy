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
import { Hono } from 'hono';
import { jest } from '@jest/globals';

// The auth engine is replaced by one that echoes what reached it, so the route
// is exercised on a real @hono/node-server connection: the request the engine
// receives is rebuilt from @hono/node-server's own request object.
const echoAuth = {
  handler: async (request) =>
    Response.json({
      method: request.method,
      clientAddress: request.headers.get('x-lowdefy-client-address'),
      body: await request.text(),
    }),
};
jest.unstable_mockModule('../../lib/build/auth.js', () => ({ default: { configured: true } }));
jest.unstable_mockModule('../../lib/build/config.js', () => ({ default: {} }));
jest.unstable_mockModule('../../lib/server/auth/getAuth.js', () => ({
  default: jest.fn(() => echoAuth),
}));

const { default: authMiddleware } = await import('./auth.js');
const { default: getClientAddress } = await import('../../lib/server/getClientAddress.js');

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

let server;
let baseUrl;

beforeAll(async () => {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { clientAddress: getClientAddress({ c, logger }) });
    await next();
  });
  app.all('/api/auth/*', authMiddleware({ logger }));
  await new Promise((resolve) => {
    server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' }, (info) => {
      baseUrl = `http://127.0.0.1:${info.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('the auth route hands the engine the connection address, not the forwarded or client-sent one', async () => {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.9',
      'x-lowdefy-client-address': '203.0.113.10',
    },
    body: JSON.stringify({ email: 'user@example.com' }),
  });
  expect(await response.json()).toEqual({
    method: 'POST',
    clientAddress: '127.0.0.1',
    body: JSON.stringify({ email: 'user@example.com' }),
  });
});

test('the auth route hands the engine a GET without a body', async () => {
  const response = await fetch(`${baseUrl}/api/auth/get-session`);
  expect(await response.json()).toEqual({ method: 'GET', clientAddress: '127.0.0.1', body: '' });
});
