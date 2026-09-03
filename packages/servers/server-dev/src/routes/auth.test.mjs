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

// Only the route wiring is under test here — getDevSession's own behaviour
// (mock/headless resolution, session-callback parity) is covered in
// lib/server/auth/getDevSession.test.mjs, and the real Auth.js engine is
// stubbed with a sentinel handler so "delegated to Auth.js" is observable.
const mockAuthHandler = jest.fn(() => (c) => c.json({ delegated: true }));
jest.unstable_mockModule('@hono/auth-js', () => ({
  authHandler: mockAuthHandler,
}));
jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { configured: true },
}));
const mockGetDevSession = jest.fn(async () => undefined);
jest.unstable_mockModule('../../lib/server/auth/getDevSession.js', () => ({
  default: mockGetDevSession,
}));

const { default: authMiddleware } = await import('./auth.js');

function createApp() {
  const app = new Hono();
  app.use('/api/auth/*', authMiddleware());
  return app;
}

afterEach(() => {
  mockGetDevSession.mockReset();
  mockGetDevSession.mockResolvedValue(undefined);
});

test('GET /api/auth/session returns the dev session so the client matches the server', async () => {
  const devSession = {
    user: {
      id: 'dev-mock-user',
      roles: ['admin'],
      global_attributes: { company_ids: ['C-1'] },
    },
    hashed_id: 'abc',
    expires: '2100-01-01T00:00:00.000Z',
  };
  mockGetDevSession.mockResolvedValue(devSession);

  const res = await createApp().request('/api/auth/session');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual(devSession);
});

test('GET /api/auth/session delegates to Auth.js when no dev session exists', async () => {
  const res = await createApp().request('/api/auth/session');
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ delegated: true });
});

test('other auth routes delegate to Auth.js even when a dev session exists', async () => {
  mockGetDevSession.mockResolvedValue({ user: { id: 'mock' } });

  const res = await createApp().request('/api/auth/csrf');
  expect(await res.json()).toEqual({ delegated: true });
});

test('POST /api/auth/session delegates to Auth.js even when a dev session exists', async () => {
  mockGetDevSession.mockResolvedValue({ user: { id: 'mock' } });

  const res = await createApp().request('/api/auth/session', { method: 'POST' });
  expect(await res.json()).toEqual({ delegated: true });
});
