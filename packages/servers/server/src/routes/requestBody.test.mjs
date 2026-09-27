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

import { parseRequestBody } from '@lowdefy/api';

const mockCallEndpoint = jest.fn();
jest.unstable_mockModule('@sentry/node', () => ({ captureException: jest.fn() }));
jest.unstable_mockModule('@lowdefy/api', () => ({
  acceptDetachedEndpoint: jest.fn(),
  callAgent: jest.fn(),
  callEndpoint: mockCallEndpoint,
  callRequest: jest.fn(),
  getEndpointConfig: jest.fn().mockRejectedValue(new Error('not found')),
  logClientError: jest.fn(),
  parseRequestBody,
  redactErrorResponse: jest.fn(),
  runWebhookEndpoint: jest.fn(),
}));

const { default: createErrorHandler } = await import('../middleware/errorHandler.js');
const routes = {
  '/api/agent/*': (await import('./agent.js')).default,
  '/api/client-error': (await import('./clientError.js')).default,
  '/api/detached/*': (await import('./detached.js')).default,
  '/api/endpoints/*': (await import('./endpoints.js')).default,
  '/api/request/*': (await import('./request.js')).default,
  '/api/usage': (await import('./usage.js')).default,
};

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger, handleError: jest.fn() });
    await next();
  });
  Object.entries(routes).forEach(([path, handler]) => app.all(path, handler));
  app.onError(createErrorHandler({ logger }));
  return app;
}

const originalCronSecret = process.env.CRON_SECRET;
beforeAll(() => {
  process.env.CRON_SECRET = 'secret';
});
afterAll(() => {
  if (originalCronSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }
});

test.each([
  ['/api/endpoints/save', 'nope', {}, 'Request body is not valid JSON.'],
  ['/api/endpoints/save', 'null', {}, 'Request body must be a JSON object.'],
  ['/api/request/orders/load', 'nope', {}, 'Request body is not valid JSON.'],
  ['/api/agent/orders/assistant', 'nope', {}, 'Request body is not valid JSON.'],
  [
    '/api/detached/save',
    'nope',
    { authorization: 'Bearer secret' },
    'Request body is not valid JSON.',
  ],
  ['/api/usage', 'nope', {}, 'Request body is not valid JSON.'],
  [
    '/api/client-error',
    'nope',
    { host: 'localhost', origin: 'http://localhost' },
    'Request body is not valid JSON.',
  ],
])('POST %s with body %s answers 400 and logs a warning', async (path, body, headers, message) => {
  const res = await createApp().request(path, { method: 'POST', body, headers });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ name: 'UserError', message });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.error).not.toHaveBeenCalled();
});

test('POST /api/endpoints with a JSON body passes its fields to callEndpoint', async () => {
  mockCallEndpoint.mockResolvedValue({ success: true });
  const res = await createApp().request('/api/endpoints/save', {
    method: 'POST',
    body: JSON.stringify({ blockId: 'b', pageId: 'p', payload: { a: 1 } }),
  });
  expect(res.status).toBe(200);
  expect(mockCallEndpoint).toHaveBeenCalledWith(expect.anything(), {
    blockId: 'b',
    endpointId: 'save',
    pageId: 'p',
    payload: { a: 1 },
  });
});
