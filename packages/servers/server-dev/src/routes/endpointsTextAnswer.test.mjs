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

const mockGetEndpointConfig = jest.fn();
const mockRunWebhookEndpoint = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  callEndpoint: jest.fn(),
  getEndpointConfig: mockGetEndpointConfig,
  parseRequestBody: jest.fn(),
  runWebhookEndpoint: mockRunWebhookEndpoint,
}));

const { default: endpointsHandler } = await import('./endpoints.js');

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger, handleError: jest.fn() });
    await next();
  });
  app.all('/api/endpoints/*', endpointsHandler);
  return app;
}

beforeEach(() => {
  mockGetEndpointConfig.mockResolvedValue({ webhook: true });
});

test('a webhook answer with contentType text/plain is sent as the plain-text body', async () => {
  mockRunWebhookEndpoint.mockResolvedValue({
    status: 200,
    body: 'Validation: Testing client application',
    contentType: 'text/plain',
  });
  const res = await createApp().request(
    '/api/endpoints/graph_notifications?validationToken=Validation%3A+Testing+client+application',
    { method: 'POST' }
  );
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toMatch(/^text\/plain\b/);
  expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  expect(await res.text()).toBe('Validation: Testing client application');
  expect(mockRunWebhookEndpoint).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      endpointId: 'graph_notifications',
      query: { validationToken: 'Validation: Testing client application' },
    })
  );
});

test('a webhook answer without contentType is still sent as JSON', async () => {
  mockRunWebhookEndpoint.mockResolvedValue({ status: 200, body: 'token' });
  const res = await createApp().request('/api/endpoints/hook', { method: 'POST', body: '{}' });
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toMatch(/^application\/json\b/);
  expect(res.headers.get('x-content-type-options')).toBeNull();
  expect(await res.json()).toBe('token');
});
