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

import parseRequestBody from '../../../../api/dist/context/parseRequestBody.js';

const mockCallEndpoint = jest.fn();
const mockCallRequest = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  callEndpoint: mockCallEndpoint,
  callRequest: mockCallRequest,
  getEndpointConfig: jest.fn().mockRejectedValue(new Error('not found')),
  parseRequestBody,
  redactErrorResponse: jest.fn(),
  runWebhookEndpoint: jest.fn(),
}));

const { default: createErrorHandler } = await import('../middleware/errorHandler.js');
const { default: endpointsHandler } = await import('./endpoints.js');
const { default: requestHandler } = await import('./request.js');

const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() };

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger, handleError: jest.fn() });
    await next();
  });
  app.all('/api/endpoints/*', endpointsHandler);
  app.all('/api/request/*', requestHandler);
  app.onError(createErrorHandler({ logger }));
  return app;
}

test.each([
  ['/api/endpoints/save', 'nope', 'Request body is not valid JSON.'],
  ['/api/request/orders/load', 'nope', 'Request body is not valid JSON.'],
  ['/api/endpoints/save', 'null', 'Request body must be a JSON object.'],
])('POST %s with body %s answers 400 and logs a warning', async (path, body, message) => {
  const res = await createApp().request(path, { method: 'POST', body });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ name: 'UserError', message });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.error).not.toHaveBeenCalled();
});
