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

import { isSameOriginRequest, parseRequestBody } from '@lowdefy/api';

const mockCallEndpoint = jest.fn();
jest.unstable_mockModule('@sentry/node', () => ({ captureException: jest.fn() }));
const mockGetEndpointConfig = jest.fn().mockRejectedValue(new Error('not found'));
const mockRunWebhookEndpoint = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  acceptDetachedEndpoint: jest.fn(),
  callAgent: jest.fn(),
  callEndpoint: mockCallEndpoint,
  callRequest: jest.fn(),
  getEndpointConfig: mockGetEndpointConfig,
  logClientError: jest.fn(),
  isSameOriginRequest,
  parseRequestBody,
  redactErrorResponse: jest.fn(),
  runWebhookEndpoint: mockRunWebhookEndpoint,
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

test('POST /api/endpoints to a webhook endpoint passes the body text exactly as sent as rawBody', async () => {
  mockGetEndpointConfig.mockResolvedValueOnce({ webhook: { verify: {} } });
  mockRunWebhookEndpoint.mockResolvedValue({ status: 200, body: { ok: true } });
  const body = '{ "zeta": 1,  "alpha": "caf\\u00e9", "beta": "café" }';
  const res = await createApp().request('/api/endpoints/signed_hook?t=1', {
    method: 'POST',
    body,
    headers: { 'x-hub-signature-256': 'sha256=abc' },
  });
  expect(res.status).toBe(200);
  expect(mockRunWebhookEndpoint).toHaveBeenCalledWith(expect.anything(), {
    endpointId: 'signed_hook',
    rawBody: body,
    query: { t: '1' },
    headers: expect.objectContaining({ 'x-hub-signature-256': 'sha256=abc' }),
  });
});

test.each([
  [200, { received: true }],
  [401, { error: { code: 'unauthorized', message: 'Webhook verification failed.' } }],
  [404, { error: 'not_found', id: 'ticket-1' }],
  [500, { error: { code: 'internal_error', message: 'Webhook failed.' } }],
])(
  'POST /api/endpoints to a webhook endpoint answers status %s with its body',
  async (status, body) => {
    mockGetEndpointConfig.mockResolvedValueOnce({ webhook: true });
    mockRunWebhookEndpoint.mockResolvedValue({ status, body });
    const res = await createApp().request('/api/endpoints/hook', { method: 'POST', body: '{}' });
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual(body);
  }
);
