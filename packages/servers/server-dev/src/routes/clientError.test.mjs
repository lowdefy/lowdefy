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

const mockLogClientError = jest.fn();
const mockPush = jest.fn();

// The same-origin rule is the real one from @lowdefy/api; only the logging is mocked.
const api = await import('@lowdefy/api');
jest.unstable_mockModule('@lowdefy/api', () => ({
  ...api,
  logClientError: mockLogClientError,
}));
jest.unstable_mockModule('../../lib/docs/clientErrorStore.js', () => ({
  default: { push: mockPush },
}));

const { default: clientErrorHandler } = await import('./clientError.js');

function post(headers) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { recording: null });
    await next();
  });
  app.all('/api/client-error', clientErrorHandler);
  return app.request('/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ error: { message: 'Block failed' } }),
  });
}

beforeEach(() => {
  mockLogClientError.mockResolvedValue({
    error: { name: 'BlockError', message: 'Block failed' },
    source: 'pages/home.yaml:12',
  });
});

test('clientError accepts an error from a phone paired with lowdefy dev --lan', async () => {
  const res = await post({ host: '192.168.1.20:3000', 'x-lowdefy-dev-remote': '1' });
  expect(res.status).toEqual(200);
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'BlockError', source: 'pages/home.yaml:12' })
  );
});

test('clientError accepts an error from a simulator shell, which sends no origin', async () => {
  const res = await post({ host: 'localhost:3000' });
  expect(res.status).toEqual(200);
});

test('clientError accepts an error from the app page itself', async () => {
  const res = await post({
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    'sec-fetch-site': 'same-origin',
  });
  expect(res.status).toEqual(200);
});

test('clientError refuses an error a page on another site posts', async () => {
  const res = await post({
    host: 'localhost:3000',
    origin: 'https://attacker.example',
    'sec-fetch-site': 'cross-site',
  });
  expect(res.status).toEqual(403);
  expect(mockPush).not.toHaveBeenCalled();
});
