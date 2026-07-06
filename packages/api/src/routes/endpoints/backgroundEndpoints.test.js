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

import { jest } from '@jest/globals';
import { ConfigError } from '@lowdefy/errors';

import callEndpoint from './callEndpoint.js';
import scheduleBackground from './scheduleBackground.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
});

test('scheduleBackground logs completion and failure, never rejects', async () => {
  const context = { logger };
  await scheduleBackground(context, { event: 'bg', endpointId: 'ep' }, async () => ({
    status: 'success',
  }));
  expect(logger.info).toHaveBeenCalledWith({ event: 'bg_done', endpointId: 'ep', status: 'success' });

  await scheduleBackground(context, { event: 'bg', endpointId: 'ep' }, async () => {
    throw new Error('boom');
  });
  expect(logger.error).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'bg_failed', endpointId: 'ep' }),
    'boom'
  );
});

test('scheduleBackground hands the promise to context.waitUntil when the server injects it', async () => {
  const waitUntil = jest.fn();
  const context = { logger, waitUntil };
  await scheduleBackground(context, { event: 'bg', endpointId: 'ep' }, async () => ({}));
  expect(waitUntil).toHaveBeenCalledTimes(1);
});

test('async: true returns immediately and runs the routine in the background', async () => {
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/bg_ep.json') {
      return {
        endpointId: 'bg_ep',
        type: 'Api',
        auth: { public: true },
        async: true,
        routine: { ':return': 'done' },
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'bg_ep',
    pageId: 'p',
    payload: {},
  });
  expect(result).toEqual({
    error: null,
    response: { accepted: true },
    status: 'accepted',
    success: true,
  });
  await flush();
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'background_endpoint_done', endpointId: 'bg_ep' })
  );
});

test('detached: true dispatches to /api/detached with CRON_SECRET and continues', async () => {
  process.env.CRON_SECRET = 'shhh';
  const fetchMock = jest.fn(async () => ({ status: 200 }));
  global.fetch = fetchMock;
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/parent_ep.json') {
      return {
        endpointId: 'parent_ep',
        type: 'Api',
        auth: { public: true },
        routine: [
          {
            id: 'endpoint:parent_ep:spawn',
            stepId: 'spawn',
            type: 'CallApi',
            properties: { endpointId: 'child_ep', detached: true, payload: { a: 1 } },
          },
          { ':return': { spawned: { _step: 'spawn.detached' } } },
        ],
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  context.origin = 'https://app.test';
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'parent_ep',
    pageId: 'p',
    payload: {},
  });
  expect(result.success).toBe(true);
  await flush();
  expect(fetchMock).toHaveBeenCalledWith(
    'https://app.test/api/detached/child_ep',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer shhh' }),
    })
  );
  delete process.env.CRON_SECRET;
});

test('detached: true without CRON_SECRET throws a ConfigError', async () => {
  delete process.env.CRON_SECRET;
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/parent_ep.json') {
      return {
        endpointId: 'parent_ep',
        type: 'Api',
        auth: { public: true },
        routine: [
          {
            id: 'endpoint:parent_ep:spawn',
            stepId: 'spawn',
            type: 'CallApi',
            properties: { endpointId: 'child_ep', detached: true },
          },
        ],
      };
    }
    return null;
  });
  const context = testContext({ logger, readConfigFile: mockReadConfigFile });
  context.origin = 'https://app.test';
  const result = await callEndpoint(context, {
    blockId: 'b',
    endpointId: 'parent_ep',
    pageId: 'p',
    payload: {},
  });
  expect(result.success).toBe(false);
  expect(result.error).toBeTruthy();
});

test('hook endpoints: gated on hook: true, payload is { body, query, headers }', async () => {
  const { default: runHookEndpoint } = await import('./runHookEndpoint.js');
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/hook_ep.json') {
      return {
        endpointId: 'hook_ep',
        type: 'Api',
        hook: true,
        routine: { ':return': { echo: { _payload: 'query.t' } } },
      };
    }
    if (path === 'api/plain_ep.json') {
      return { endpointId: 'plain_ep', type: 'Api', routine: { ':return': 'x' } };
    }
    return null;
  });
  const operators = {
    _payload: ({ params, payload }) =>
      String(params)
        .split('.')
        .reduce((acc, key) => acc?.[key], payload),
  };
  const context = testContext({ logger, operators, readConfigFile: mockReadConfigFile });
  const result = await runHookEndpoint(context, {
    endpointId: 'hook_ep',
    body: { hello: 1 },
    query: { t: 'tok' },
    headers: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ echo: 'tok' });

  const context2 = testContext({ logger, readConfigFile: mockReadConfigFile });
  await expect(
    runHookEndpoint(context2, { endpointId: 'plain_ep', body: {}, query: {}, headers: {} })
  ).rejects.toThrow('does not exist');
});
