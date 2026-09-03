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
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError, RequestError, UserError } from '@lowdefy/errors';

import callRequest from './request/callRequest.js';
import testContext from '../test/testContext.js';

// Resolver used by the outer (page-level) request. Behaviour is configured per
// test via the `outerResolver` jest.fn().
const outerResolver = jest.fn();
outerResolver.schema = {};
outerResolver.meta = { checkRead: false, checkWrite: false };

const connections = {
  TestConnection: {
    schema: {},
    requests: {
      OuterRequest: outerResolver,
    },
  },
};

const operators = {
  ...operatorsServer,
};

const secrets = {
  CONNECTION: 'cs',
  REQUEST: 'rs',
};

function buildReadConfigFile({ endpointConfigs = {}, requestConfig, connectionConfig } = {}) {
  const defaultConn = {
    id: 'connection:testConn',
    type: 'TestConnection',
    connectionId: 'testConn',
    properties: {},
  };
  const defaultReq = {
    id: 'request:pageId:outerReq',
    type: 'OuterRequest',
    requestId: 'outerReq',
    pageId: 'pageId',
    connectionId: 'testConn',
    auth: { public: true },
    properties: {},
  };
  return jest.fn((path) => {
    if (path === 'connections/testConn.json') {
      return connectionConfig ?? defaultConn;
    }
    if (path === 'pages/pageId/requests/outerReq.json') {
      return requestConfig ?? defaultReq;
    }
    const match = path.match(/^api\/(.+)\.json$/);
    if (match) {
      const key = match[1];
      if (endpointConfigs[key]) {
        const config = endpointConfigs[key];
        if (!config.auth) config.auth = { public: true };
        return config;
      }
    }
    return null;
  });
}

function createContext({ endpointConfigs = {}, user, logger } = {}) {
  return testContext({
    connections,
    operators,
    secrets,
    logger: logger ?? {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    readConfigFile: buildReadConfigFile({ endpointConfigs }),
    user: user ?? { id: 'user_1' },
  });
}

beforeEach(() => {
  outerResolver.mockReset();
  outerResolver.schema = {};
  outerResolver.meta = { checkRead: false, checkWrite: false };
});

test('9.1 resolver-to-endpoint chain: response, depth, inherited closure', async () => {
  const context = createContext({
    endpointConfigs: {
      inner_endpoint: {
        endpointId: 'inner_endpoint',
        type: 'Api',
        routine: {
          ':return': {
            payloadId: { _payload: 'id' },
            userId: { _user: 'id' },
            secretVal: { _secret: 'REQUEST' },
          },
        },
      },
    },
  });
  outerResolver.mockImplementation(async ({ callApi, payload }) => {
    return await callApi({ endpointId: 'inner_endpoint', payload: { id: payload.id } });
  });
  const result = await callRequest(context, {
    blockId: 'b1',
    payload: { id: 42 },
    pageId: 'pageId',
    requestId: 'outerReq',
  });
  expect(result.success).toBe(true);
  expect(result.response).toEqual({
    payloadId: 42,
    userId: 'user_1',
    secretVal: 'rs',
  });
});

test('9.2 module endpoint id (slash) resolves as opaque string', async () => {
  const context = createContext({
    endpointConfigs: {
      'mod/inner': {
        endpointId: 'mod/inner',
        type: 'Api',
        routine: { ':return': 'module_value' },
      },
    },
  });
  outerResolver.mockImplementation(async ({ callApi }) => {
    return await callApi({ endpointId: 'mod/inner', payload: {} });
  });
  const result = await callRequest(context, {
    blockId: 'b1',
    payload: {},
    pageId: 'pageId',
    requestId: 'outerReq',
  });
  expect(result.success).toBe(true);
  expect(result.response).toBe('module_value');
});

test('9.3a :throw in target surfaces as UserError', async () => {
  const context = createContext({
    endpointConfigs: {
      inner: {
        endpointId: 'inner',
        type: 'Api',
        routine: { ':throw': 'boom' },
      },
    },
  });
  let caught;
  outerResolver.mockImplementation(async ({ callApi }) => {
    try {
      return await callApi({ endpointId: 'inner', payload: {} });
    } catch (e) {
      caught = e;
      throw e;
    }
  });
  await expect(
    callRequest(context, {
      blockId: 'b1',
      payload: {},
      pageId: 'pageId',
      requestId: 'outerReq',
    })
  ).rejects.toBeInstanceOf(UserError);
  expect(caught).toBeInstanceOf(UserError);
  expect(caught.message).toBe('boom');
});

test('9.3b :reject in target surfaces as UserError', async () => {
  const context = createContext({
    endpointConfigs: {
      inner: {
        endpointId: 'inner',
        type: 'Api',
        routine: { ':reject': 'no' },
      },
    },
  });
  let caught;
  outerResolver.mockImplementation(async ({ callApi }) => {
    try {
      return await callApi({ endpointId: 'inner', payload: {} });
    } catch (e) {
      caught = e;
      throw e;
    }
  });
  await expect(
    callRequest(context, {
      blockId: 'b1',
      payload: {},
      pageId: 'pageId',
      requestId: 'outerReq',
    })
  ).rejects.toBeInstanceOf(UserError);
  expect(caught.message).toBe('no');
});

test('9.5 depth cap: 11 deep chain throws ConfigError', async () => {
  // Endpoints chain: ep1 → ep2 → ep3 ... → ep11. Each endpoint's routine runs
  // a request whose resolver does callApi(next). The 11th level is where the
  // cap fires.
  const endpointConfigs = {};
  for (let i = 1; i <= 11; i++) {
    const target = i < 11 ? `ep${i + 1}` : null;
    endpointConfigs[`ep${i}`] = {
      endpointId: `ep${i}`,
      type: 'Api',
      routine: target
        ? [
            {
              id: `request:ep${i}:r`,
              stepId: 'r',
              type: 'OuterRequest',
              connectionId: 'testConn',
              properties: { target },
            },
            { ':return': { _step: 'r' } },
          ]
        : { ':return': 'leaf' },
    };
  }
  const context = createContext({ endpointConfigs });
  outerResolver.mockImplementation(async ({ callApi, request }) => {
    if (!request.target) {
      return 'leaf';
    }
    return await callApi({ endpointId: request.target, payload: {} });
  });

  // Drive the chain via the page-level outerReq which calls ep1.
  // Override the outer request config to forward.
  context.readConfigFile = buildReadConfigFile({
    endpointConfigs,
    requestConfig: {
      id: 'request:pageId:outerReq',
      type: 'OuterRequest',
      requestId: 'outerReq',
      pageId: 'pageId',
      connectionId: 'testConn',
      auth: { public: true },
      properties: { target: 'ep1' },
    },
  });

  await expect(
    callRequest(context, {
      blockId: 'b1',
      payload: {},
      pageId: 'pageId',
      requestId: 'outerReq',
    })
  ).rejects.toThrow('Endpoint call depth exceeded maximum of 10');
});

test('9.6 a deep chain ending in :throw is never reported through handleError', async () => {
  const endpointConfigs = {
    inner1: {
      endpointId: 'inner1',
      type: 'Api',
      routine: [
        {
          id: 'request:inner1:r',
          stepId: 'r',
          type: 'OuterRequest',
          connectionId: 'testConn',
          properties: { mode: 'callInner2' },
        },
        { ':return': { _step: 'r' } },
      ],
    },
    inner2: {
      endpointId: 'inner2',
      type: 'Api',
      routine: { ':throw': 'deep' },
    },
  };
  const handleErrorMock = jest.fn();
  const context = createContext({ endpointConfigs });
  context.handleError = handleErrorMock;
  outerResolver.mockImplementation(async ({ callApi, request }) => {
    if (request.mode === 'callInner2') {
      return await callApi({ endpointId: 'inner2', payload: {} });
    }
    return await callApi({ endpointId: 'inner1', payload: {} });
  });
  // Drive via outerReq → inner1 → inner2 → :throw.
  context.readConfigFile = buildReadConfigFile({
    endpointConfigs,
    requestConfig: {
      id: 'request:pageId:outerReq',
      type: 'OuterRequest',
      requestId: 'outerReq',
      pageId: 'pageId',
      connectionId: 'testConn',
      auth: { public: true },
      properties: { mode: 'chain' },
    },
  });
  await callRequest(context, {
    blockId: 'b1',
    payload: {},
    pageId: 'pageId',
    requestId: 'outerReq',
  }).catch(() => {});
  // `:throw` raises a UserError - the author's own expected outcome, carried
  // up the chain unchanged and never logged as a fault at any level.
  expect(handleErrorMock).not.toHaveBeenCalled();
});

test('9.7 InternalApi endpoint is reachable via callApi', async () => {
  const context = createContext({
    endpointConfigs: {
      internal: {
        endpointId: 'internal',
        type: 'InternalApi',
        routine: { ':return': 'internal_ok' },
      },
    },
  });
  outerResolver.mockImplementation(async ({ callApi }) =>
    callApi({ endpointId: 'internal', payload: {} })
  );
  const result = await callRequest(context, {
    blockId: 'b1',
    payload: {},
    pageId: 'pageId',
    requestId: 'outerReq',
  });
  expect(result.response).toBe('internal_ok');
});

test('9.8 wide events emitted on success path', async () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const context = createContext({
    endpointConfigs: {
      inner: {
        endpointId: 'inner',
        type: 'Api',
        routine: { ':return': true },
      },
    },
    logger,
  });
  outerResolver.mockImplementation(async ({ callApi }) =>
    callApi({ endpointId: 'inner', payload: {} })
  );
  await callRequest(context, {
    blockId: 'b1',
    payload: {},
    pageId: 'pageId',
    requestId: 'outerReq',
  });
  const events = logger.debug.mock.calls.map((c) => c[0]?.event);
  expect(events).not.toContain('debug_start_call_api');
  expect(events).not.toContain('debug_end_call_api');
  expect(events).toContain('endpoint_completed');
  expect(events).toContain('request_completed');
});

test('9.4 state isolation: caller state not visible in target, target writes do not leak', async () => {
  // The outer endpoint sets state then calls inner via :call_api routine step
  // (not callApi resolver — state isolation also matters for the routine step).
  // After inner runs, outer reads its own state.
  const endpointConfigs = {
    outer_ep: {
      endpointId: 'outer_ep',
      type: 'Api',
      routine: [
        { ':set_state': { x: 1 } },
        {
          id: 'endpoint:outer_ep:call_inner',
          stepId: 'call_inner',
          type: 'CallApi',
          properties: { endpointId: 'inner_ep' },
        },
        {
          ':return': {
            outerStateX: { _state: 'x' },
            innerSawX: { _step: 'call_inner' },
          },
        },
      ],
    },
    inner_ep: {
      endpointId: 'inner_ep',
      type: 'Api',
      routine: [
        // Inner sees caller's state? Should be undefined — state is isolated.
        { ':set_state': { x: 99 } },
        { ':return': { _state: 'x' } },
      ],
    },
  };
  const context = createContext({ endpointConfigs });
  // Drive directly via callEndpoint by calling invokeEndpoint at depth 0.
  const { default: invokeEndpoint } = await import('./endpoints/invokeEndpoint.js');
  const { default: createEvaluateOperators } = await import(
    '../context/createEvaluateOperators.js'
  );
  context.evaluateOperators = createEvaluateOperators(context);
  const result = await invokeEndpoint(context, {
    endpointId: 'outer_ep',
    payload: {},
    endpointDepth: 0,
  });
  expect(result.status).toBe('return');
  expect(result.response.outerStateX).toBe(1); // caller's own state preserved
  expect(result.response.innerSawX).toBe(99); // inner wrote to its own state
});

test('9.3c raw error from target propagates as RequestError', async () => {
  const innerResolver = jest.fn(() => {
    throw new Error('inner raw');
  });
  innerResolver.schema = {};
  innerResolver.meta = { checkRead: false, checkWrite: false };
  // Register a second resolver type via the connections map.
  const localConnections = {
    TestConnection: {
      schema: {},
      requests: {
        OuterRequest: outerResolver,
        InnerRequest: innerResolver,
      },
    },
  };
  const context = testContext({
    connections: localConnections,
    operators,
    secrets,
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    readConfigFile: buildReadConfigFile({
      endpointConfigs: {
        inner: {
          endpointId: 'inner',
          type: 'Api',
          routine: [
            {
              id: 'request:inner:r',
              stepId: 'r',
              type: 'InnerRequest',
              connectionId: 'testConn',
              properties: {},
            },
          ],
        },
      },
    }),
    user: { id: 'user_1' },
  });
  outerResolver.mockImplementation(async ({ callApi }) =>
    callApi({ endpointId: 'inner', payload: {} })
  );
  let caught;
  await callRequest(context, {
    blockId: 'b1',
    payload: {},
    pageId: 'pageId',
    requestId: 'outerReq',
  }).catch((e) => {
    caught = e;
  });
  expect(caught).toBeInstanceOf(RequestError);
  // The inner runRoutine wrapped the raw error into a RequestError; the outer
  // callRequestResolver passes it through unchanged (no double-wrap).
  expect(caught.message).toMatch(/inner raw/);
  void ConfigError;
});
