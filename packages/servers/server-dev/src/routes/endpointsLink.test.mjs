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
import { vi, beforeEach, expect, test } from 'vitest';

const mockRunLinkEndpoint = vi.fn();
const mockCallEndpoint = vi.fn();
vi.doMock('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
  getEndpointConfig: vi.fn().mockRejectedValue(new Error('API Endpoint does not exist.')),
  parseRequestBody: vi.fn(() => ({ payload: {} })),
  runLinkEndpoint: mockRunLinkEndpoint,
  runWebhookEndpoint: vi.fn(),
}));

const { default: endpointsHandler } = await import('./endpoints.js');
const { default: noStore } = await import('../middleware/noStore.js');
const { default: stampCaller } = await import('../middleware/stampCaller.js');

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };

// The middleware app.js puts on /api/endpoints/*, so a plain browser image GET is checked
// against what they do with no Lowdefy headers.
function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger, handleError: vi.fn(), user: { id: 'user_1' } });
    await next();
  });
  app.use('/api/endpoints/*', noStore());
  app.use('/api/endpoints/*', stampCaller());
  app.all('/api/endpoints/*', endpointsHandler);
  return app;
}

beforeEach(() => {
  mockRunLinkEndpoint.mockReset();
});

test('a GET answers 302 to the link, not stored by any cache', async () => {
  mockRunLinkEndpoint.mockResolvedValue({
    status: 302,
    location: 'https://bucket.s3.amazonaws.com/x.png?X-Amz-Signature=sig',
  });
  const res = await createApp().request('/api/endpoints/files/x.png', { headers: {} });
  expect(res.status).toBe(302);
  expect(res.headers.get('location')).toBe(
    'https://bucket.s3.amazonaws.com/x.png?X-Amz-Signature=sig'
  );
  expect(res.headers.get('cache-control')).toBe('private, no-store');
  expect(await res.text()).toBe('');
});

test('a GET passes the decoded path segments and the query to runLinkEndpoint', async () => {
  mockRunLinkEndpoint.mockResolvedValue({ status: 302, location: '/x.png' });
  await createApp().request('/api/endpoints/a/b/log-events/2024/x%20y+z.png?v=2&w=a+b');
  expect(mockRunLinkEndpoint).toHaveBeenCalledWith(expect.anything(), {
    segments: ['a', 'b', 'log-events', '2024', 'x y+z.png'],
    query: { v: '2', w: 'a b' },
  });
});

test('a GET keeps an encoded slash and percent sign inside one segment', async () => {
  mockRunLinkEndpoint.mockResolvedValue({ status: 302, location: '/x.png' });
  await createApp().request('/api/endpoints/files/a%2Fb%25.png');
  expect(mockRunLinkEndpoint).toHaveBeenCalledWith(expect.anything(), {
    segments: ['files', 'a/b%.png'],
    query: {},
  });
});

test('a refused GET answers its status with no body', async () => {
  mockRunLinkEndpoint.mockResolvedValue({ status: 401 });
  const res = await createApp().request('/api/endpoints/files/x.png');
  expect(res.status).toBe(401);
  expect(res.headers.get('cache-control')).toBe('private, no-store');
  expect(await res.text()).toBe('');
});

test('a GET that names no link endpoint answers 404 with an error body', async () => {
  mockRunLinkEndpoint.mockResolvedValue({ status: 404, body: { error: 'Not found.' } });
  const res = await createApp().request('/api/endpoints/unknown/x.png');
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: 'Not found.' });
});

test('any method but GET and POST answers 405', async () => {
  const res = await createApp().request('/api/endpoints/files/x.png', { method: 'PUT' });
  expect(res.status).toBe(405);
  expect(mockRunLinkEndpoint).not.toHaveBeenCalled();
});

test('a GET with a malformed percent escape answers 400 without running the link', async () => {
  const res = await createApp().request('/api/endpoints/files/100%ZZ.png');
  expect(res.status).toBe(400);
  expect(mockRunLinkEndpoint).not.toHaveBeenCalled();
});
