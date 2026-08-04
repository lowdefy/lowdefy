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
import { serializer } from '@lowdefy/helpers';

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
  expect(logger.info).toHaveBeenCalledWith({
    event: 'bg_done',
    endpointId: 'ep',
    status: 'success',
  });

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
  const context = testContext({
    logger,
    readConfigFile: mockReadConfigFile,
    user: { id: 'user_1', roles: ['admin'] },
  });
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
  // The dispatcher's resolved identity is serialized into the loopback body.
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.principal.system).toBe(false);
  expect(serializer.deserialize(body.principal.user)).toEqual({ id: 'user_1', roles: ['admin'] });
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

// Webhook earn-trust scenarios (Decision 3). A stub verifier plugin exercises
// the pass/fail branches without a concrete provider verifier (out of scope):
// it is a request resolver living on a connection, resolved and run through the
// request-plugin machinery just like any request.
const verifierConnections = {
  StubVerifyConnection: {
    schema: true,
    requests: {
      // Passes when the raw request carries query.token === 'good'.
      StubVerify: ({ request }) => request.token === 'good',
    },
  },
};

function createWebhookReadConfigFile({ parent }) {
  return jest.fn((path) => {
    if (path === `api/${parent.endpointId}.json`) {
      return parent;
    }
    if (path === 'api/child_ep.json') {
      return {
        endpointId: 'child_ep',
        type: 'Api',
        auth: { public: false },
        routine: { ':return': 'child_ran' },
      };
    }
    if (path === 'connections/verifier.json') {
      return {
        id: 'connection:verifier',
        type: 'StubVerifyConnection',
        connectionId: 'verifier',
        properties: {},
      };
    }
    return null;
  });
}

const stubVerify = {
  connectionId: 'verifier',
  type: 'StubVerify',
  properties: { token: { _payload: 'query.token' } },
};

test('webhook with no verifier fails a nested protected Api CallApi (untrusted throughout)', async () => {
  const readConfigFile = createNestedCallReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: true },
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
  // Untrusted (context.system unset): the nested protected call fails closed
  // exactly as an unauthenticated, caller-less call would - AuthenticationError.
  expect(result.success).toBe(false);
  expect(serializer.deserialize(result.error).message).toContain('Authentication required');
});

test('webhook with no verifier fails a nested protected InternalApi CallApi (untrusted throughout)', async () => {
  const readConfigFile = jest.fn((path) => {
    if (path === 'api/parent_hook.json') {
      return {
        endpointId: 'parent_hook',
        type: 'Api',
        auth: { public: true },
        webhook: true,
        routine: nestedCallRoutine('parent_hook'),
      };
    }
    if (path === 'api/child_ep.json') {
      return {
        endpointId: 'child_ep',
        type: 'InternalApi',
        auth: { public: false },
        routine: { ':return': 'child_ran' },
      };
    }
    return null;
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: {},
    headers: {},
  });
  // InternalApi is an HTTP-exposure choice, not a trust tier - it earns no
  // special pass in an untrusted run, so this fails closed like any protected
  // caller-less call.
  expect(result.success).toBe(false);
  expect(serializer.deserialize(result.error).message).toContain('Authentication required');
});

test('webhook whose verify gate fails returns unauthorized and never runs the routine', async () => {
  const readConfigFile = createWebhookReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: true },
      webhook: { verify: stubVerify },
      routine: nestedCallRoutine('parent_hook'),
    },
  });
  const context = testContext({
    logger,
    operators: operatorsServer,
    connections: verifierConnections,
    readConfigFile,
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: { token: 'bad' },
    headers: {},
  });
  expect(result.status).toBe('unauthorized');
  expect(result.success).toBe(false);
  // The routine never ran - the child endpoint config was never read.
  expect(readConfigFile).not.toHaveBeenCalledWith('api/child_ep.json');
});

test('webhook whose verify gate passes blanket-passes a nested protected CallApi', async () => {
  const readConfigFile = createWebhookReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: true },
      webhook: { verify: stubVerify },
      routine: nestedCallRoutine('parent_hook'),
    },
  });
  const context = testContext({
    logger,
    operators: operatorsServer,
    connections: verifierConnections,
    readConfigFile,
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: { token: 'good' },
    headers: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

// A verifier connection whose type implements the tenant scoping contract -
// under policy: tenant the wall engages for it like for any connection.
const walledVerifierConnections = {
  StubVerifyConnection: {
    ...verifierConnections.StubVerifyConnection,
    meta: { tenant: true },
  },
};

test('webhook verifier on a walled connection fails closed to unauthorized, never an error body', async () => {
  const readConfigFile = createWebhookReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: true },
      webhook: { verify: stubVerify },
      routine: nestedCallRoutine('parent_hook'),
    },
  });
  const context = testContext({
    logger,
    operators: operatorsServer,
    connections: walledVerifierConnections,
    organization: { policy: 'tenant' },
    readConfigFile,
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: { token: 'good' },
    headers: {},
  });
  // Webhooks run in system context with no caller organization - the tenant
  // wall refuses the verifier, and the refusal is a false verdict, not an
  // AuthenticationError surfaced to the unauthenticated sender.
  expect(result.status).toBe('unauthorized');
  expect(result.success).toBe(false);
  expect(readConfigFile).not.toHaveBeenCalledWith('api/child_ep.json');
});

test('webhook verifier on a walled connection with tenant none opts out and passes', async () => {
  const readConfigFile = createWebhookReadConfigFile({
    parent: {
      endpointId: 'parent_hook',
      type: 'Api',
      auth: { public: true },
      webhook: { verify: { ...stubVerify, tenant: 'none' } },
      routine: nestedCallRoutine('parent_hook'),
    },
  });
  const context = testContext({
    logger,
    operators: operatorsServer,
    connections: walledVerifierConnections,
    organization: { policy: 'tenant' },
    readConfigFile,
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'parent_hook',
    body: {},
    query: { token: 'good' },
    headers: {},
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

// Detached carries the dispatcher's identity (Decision 4). The child endpoint
// is protected by roles so the carried identity is what decides the nested call.
function createDetachedReadConfigFile({ childRoles = ['admin'] } = {}) {
  return jest.fn((path) => {
    if (path === 'api/parent_detached.json') {
      return {
        endpointId: 'parent_detached',
        type: 'Api',
        auth: { public: false },
        routine: nestedCallRoutine('parent_detached'),
      };
    }
    if (path === 'api/child_ep.json') {
      return {
        endpointId: 'child_ep',
        type: 'Api',
        auth: { public: false, roles: childRoles },
        routine: { ':return': 'child_ran' },
      };
    }
    return null;
  });
}

test('detached run dispatched by a system context blanket-passes a nested protected CallApi', async () => {
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: createDetachedReadConfigFile(),
  });
  const result = await runDetachedEndpoint(context, {
    endpointId: 'parent_detached',
    payload: {},
    principal: { user: serializer.serialize(null), system: true },
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

test('detached run dispatched by a user carries their roles - a permitted nested CallApi succeeds', async () => {
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: createDetachedReadConfigFile({ childRoles: ['admin'] }),
  });
  const result = await runDetachedEndpoint(context, {
    endpointId: 'parent_detached',
    payload: {},
    principal: {
      user: serializer.serialize({ id: 'user_1', roles: ['admin'] }),
      system: false,
    },
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ child: 'child_ran' });
});

test('detached run dispatched by a user is re-checked against their roles - a forbidden nested CallApi fails as it would synchronously', async () => {
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: createDetachedReadConfigFile({ childRoles: ['admin'] }),
  });
  const result = await runDetachedEndpoint(context, {
    endpointId: 'parent_detached',
    payload: {},
    principal: {
      user: serializer.serialize({ id: 'user_1', roles: ['viewer'] }),
      system: false,
    },
  });
  // Authenticated but wrong roles - masked exactly as a synchronous call would
  // be ("...does not exist"), not AuthenticationError.
  expect(result.success).toBe(false);
  expect(serializer.deserialize(result.error).message).toContain('does not exist');
});

test('detached rehydrates the carried principal - roles are present on context.user', async () => {
  const readConfigFile = jest.fn((path) => {
    if (path === 'api/echo_user.json') {
      return {
        endpointId: 'echo_user',
        type: 'Api',
        auth: { public: false },
        routine: { ':return': { roles: { _user: 'roles' } } },
      };
    }
    return null;
  });
  const context = testContext({ logger, operators: operatorsServer, readConfigFile });
  const result = await runDetachedEndpoint(context, {
    endpointId: 'echo_user',
    payload: {},
    principal: {
      user: serializer.serialize({ id: 'user_1', roles: ['admin'], organizationId: 'org_1' }),
      system: false,
    },
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({ roles: ['admin'] });
  expect(context.user).toEqual({ id: 'user_1', roles: ['admin'], organizationId: 'org_1' });
});
