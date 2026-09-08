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
import { operatorsServer } from '@lowdefy/operators-js';

import callEndpoint from './callEndpoint.js';
import runDetachedEndpoint from './runDetachedEndpoint.js';
import runScheduledEndpoint from './runScheduledEndpoint.js';
import runWebhookEndpoint from './runWebhookEndpoint.js';
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

test('webhook endpoints: gated on webhook: true, payload is { body, query, headers }', async () => {
  const { default: runWebhookEndpoint } = await import('./runWebhookEndpoint.js');
  const mockReadConfigFile = jest.fn((path) => {
    if (path === 'api/hook_ep.json') {
      return {
        endpointId: 'hook_ep',
        type: 'Api',
        webhook: true,
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
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook_ep',
    body: { hello: 1 },
    query: { t: 'tok' },
    headers: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ echo: 'tok' });

  const context2 = testContext({ logger, readConfigFile: mockReadConfigFile });
  await expect(
    runWebhookEndpoint(context2, { endpointId: 'plain_ep', body: {}, query: {}, headers: {} })
  ).rejects.toThrow('does not exist');
});

// Nested CallApi authorization in system contexts — a routine already running was
// authorized at its entry point (CRON_SECRET / webhook token), so CallApi steps to
// protected endpoints must not be re-gated on a (missing) user session.

function createNestedCallReadConfigFile({ parent, childType = 'Api' }) {
  return jest.fn((path) => {
    if (path === `api/${parent.endpointId}.json`) {
      return parent;
    }
    if (path === 'api/child_ep.json') {
      return {
        endpointId: 'child_ep',
        type: childType,
        auth: { public: false },
        routine: { ':return': 'child_ran' },
      };
    }
    return null;
  });
}

const nestedCallRoutine = (parentId) => [
  {
    id: `endpoint:${parentId}:call_child`,
    stepId: 'call_child',
    type: 'CallApi',
    properties: { endpointId: 'child_ep', payload: {} },
  },
  { ':return': { child: { _step: 'call_child' } } },
];

test('scheduled endpoint CallApi to a protected Api endpoint runs the child routine', async () => {
  const readConfigFile = createNestedCallReadConfigFile({
    parent: {
      endpointId: 'parent_cron',
      type: 'Api',
      auth: { public: false },
      schedules: [{ cron: '0 6 * * *' }],
      routine: nestedCallRoutine('parent_cron'),
    },
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runScheduledEndpoint(context, {
    endpointId: 'parent_cron',
    cron: '0 6 * * *',
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

test('scheduled endpoint CallApi to a protected InternalApi endpoint runs the child routine', async () => {
  const readConfigFile = createNestedCallReadConfigFile({
    parent: {
      endpointId: 'parent_cron',
      type: 'Api',
      auth: { public: false },
      schedules: [{ cron: '0 6 * * *' }],
      routine: nestedCallRoutine('parent_cron'),
    },
    childType: 'InternalApi',
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runScheduledEndpoint(context, {
    endpointId: 'parent_cron',
    cron: '0 6 * * *',
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

test('webhook endpoint CallApi to a protected Api endpoint runs the child routine', async () => {
  const readConfigFile = createNestedCallReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: false },
      webhook: true,
      routine: nestedCallRoutine('parent_hook'),
    },
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: {},
    headers: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

test('detached endpoint CallApi to a protected Api endpoint runs the child routine', async () => {
  const readConfigFile = createNestedCallReadConfigFile({
    parent: {
      endpointId: 'parent_detached',
      type: 'Api',
      auth: { public: false },
      routine: nestedCallRoutine('parent_detached'),
    },
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runDetachedEndpoint(context, {
    endpointId: 'parent_detached',
    payload: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});
