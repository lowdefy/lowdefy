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

const mockLogClientError = vi.fn();
const mockCaptureSentryError = vi.fn();
const mockChild = vi.fn((fields) => ({ fields }));

// The same-origin rule is the real one from @lowdefy/api; only the logging is mocked.
const api = await import('@lowdefy/api');
vi.doMock('@lowdefy/api', () => ({
  ...api,
  logClientError: mockLogClientError,
}));
vi.doMock('../../lib/server/sentry/captureSentryError.js', () => ({
  default: mockCaptureSentryError,
}));

const { default: clientErrorHandler } = await import('./clientError.js');

function post(headers) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger: { child: mockChild } });
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
  mockLogClientError.mockReset();
  mockCaptureSentryError.mockReset();
  mockChild.mockClear();
  mockLogClientError.mockResolvedValue({
    error: { name: 'BlockError', message: 'Block failed' },
    source: 'pages/home.yaml:12',
  });
});

test('clientError accepts an error from a phone shell, which sends no origin', async () => {
  const res = await post({ host: 'app.test', 'x-lowdefy-shell': '7.1.0' });
  expect(res.status).toEqual(200);
  expect(mockLogClientError).toHaveBeenCalledTimes(1);
  expect(mockCaptureSentryError).toHaveBeenCalledTimes(1);
});

test('clientError accepts an error from the app page itself', async () => {
  const res = await post({
    host: 'app.test',
    origin: 'https://app.test',
    'sec-fetch-site': 'same-origin',
  });
  expect(res.status).toEqual(200);
});

test('clientError refuses an error a page on another site posts', async () => {
  const res = await post({ host: 'app.test', origin: 'https://attacker.example' });
  expect(res.status).toEqual(403);
  expect(mockLogClientError).not.toHaveBeenCalled();
  expect(mockCaptureSentryError).not.toHaveBeenCalled();
});

test('clientError refuses a cross-site post that sends only sec-fetch-site', async () => {
  const res = await post({ host: 'app.test', 'sec-fetch-site': 'cross-site' });
  expect(res.status).toEqual(403);
  expect(mockLogClientError).not.toHaveBeenCalled();
});

test('clientError logs a phone shell error as mobile with its shell version', async () => {
  await post({ host: 'app.test', 'x-lowdefy-shell': '7.1.0' });
  expect(mockChild).toHaveBeenCalledWith({ surface: 'mobile', shell: '7.1.0' });
  const [logContext] = mockLogClientError.mock.calls[0];
  expect(logContext.logger).toEqual({ fields: { surface: 'mobile', shell: '7.1.0' } });
});

test('clientError logs a browser error as web', async () => {
  await post({ host: 'app.test', origin: 'https://app.test' });
  expect(mockChild).toHaveBeenCalledWith({ surface: 'web' });
});

test('clientError answers 405 to a request that is not a POST', async () => {
  const app = new Hono();
  app.all('/api/client-error', clientErrorHandler);
  const res = await app.request('/api/client-error', { method: 'GET' });
  expect(res.status).toEqual(405);
});
