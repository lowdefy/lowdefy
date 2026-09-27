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

import { fileURLToPath } from 'node:url';

import { Hono } from 'hono';
import { jest } from '@jest/globals';

import { parseRequestBody } from '@lowdefy/api';

// usage.js reads package.json from the working directory as it loads, and a suite that
// ran earlier in the same jest worker may have left the working directory in a temporary
// fixture directory.
process.chdir(fileURLToPath(new URL('../..', import.meta.url)));

jest.unstable_mockModule('@lowdefy/api', () => ({
  acceptDetachedEndpoint: jest.fn(),
  callAgent: jest.fn(),
  callEndpoint: jest.fn(),
  callRequest: jest.fn(),
  getEndpointConfig: jest.fn().mockRejectedValue(new Error('not found')),
  logClientError: jest.fn(),
  parseRequestBody,
  redactErrorResponse: jest.fn(),
  runWebhookEndpoint: jest.fn(),
}));
jest.unstable_mockModule('../../lib/server/jitPageBuilder.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../lib/docs/devMockRegistry.js', () => ({
  getMock: jest.fn(),
  loadMocks: jest.fn(),
}));
jest.unstable_mockModule('../../lib/docs/loadState.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../lib/docs/snapshotState.js', () => ({ default: jest.fn() }));

const { default: createErrorHandler } = await import('../middleware/errorHandler.js');
const routes = {
  '/api/agent/*': (await import('./agent.js')).default,
  '/api/client-error': (await import('./clientError.js')).default,
  '/api/detached/*': (await import('./detached.js')).default,
  '/api/dev-inspect': (await import('./devInspect.js')).default,
  '/api/dev-inspect/*': (await import('./devInspect.js')).default,
  '/api/endpoints/*': (await import('./endpoints.js')).default,
  '/api/request/*': (await import('./request.js')).default,
  '/api/usage': (await import('./usage.js')).default,
  '/lowdefy-docs/state-checkpoints/load': (await import('./docs/loadState.js')).default,
  '/lowdefy-docs/state-checkpoints/snapshot': (await import('./docs/snapshotState.js')).default,
  '/lowdefy-feedback': (await import('./feedback.js')).default,
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

const sameOrigin = { host: 'localhost', origin: 'http://localhost' };
const notJson = JSON.stringify({ name: 'UserError', message: 'Request body is not valid JSON.' });

// Paths outside /api/ get the error handler's plain-text answer.
test.each([
  ['/api/endpoints/save', {}, notJson],
  ['/api/request/orders/load', {}, notJson],
  ['/api/agent/orders/assistant', {}, notJson],
  ['/api/detached/save', { authorization: 'Bearer secret' }, notJson],
  ['/api/usage', {}, notJson],
  ['/api/client-error', sameOrigin, notJson],
  ['/api/dev-inspect', sameOrigin, notJson],
  ['/api/dev-inspect/page', sameOrigin, notJson],
  ['/lowdefy-docs/state-checkpoints/load', {}, 'Bad Request'],
  ['/lowdefy-docs/state-checkpoints/snapshot', {}, 'Bad Request'],
  ['/lowdefy-feedback', sameOrigin, 'Bad Request'],
])(
  'POST %s with a body that is not JSON answers 400 and logs a warning',
  async (path, headers, text) => {
    const res = await createApp().request(path, { method: 'POST', body: 'nope', headers });
    expect(res.status).toBe(400);
    expect(await res.text()).toBe(text);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  }
);

test('POST /api/endpoints with a null body answers 400', async () => {
  const res = await createApp().request('/api/endpoints/save', { method: 'POST', body: 'null' });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({
    name: 'UserError',
    message: 'Request body must be a JSON object.',
  });
});
