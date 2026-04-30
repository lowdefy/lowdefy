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
import { ConfigError } from '@lowdefy/errors';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const operators = {
  ...operatorsServer,
  _error: () => {
    throw new Error('Test error.');
  },
};

const secrets = {
  CONNECTION: 'connectionSecret',
};

const mockTestRequest = jest.fn((request) => request.request.response);

mockTestRequest.schema = {};
mockTestRequest.meta = { checkRead: false, checkWrite: false };

const connections = {
  TestConnection: {
    schema: {},
    requests: {
      TestRequest: mockTestRequest,
    },
  },
};

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createMockReadConfigFile(endpointConfigs = {}) {
  return jest.fn((path) => {
    // Match connection configs
    if (path === 'connections/test.json') {
      return { id: 'connection:test', type: 'TestConnection', connectionId: 'test' };
    }
    // Match endpoint configs
    const match = path.match(/^api\/(.+)\.json$/);
    if (match && endpointConfigs[match[1]]) {
      const config = endpointConfigs[match[1]];
      // Add default auth if not present
      if (!config.auth) {
        config.auth = { public: true };
      }
      return config;
    }
    return null;
  });
}

function createTestContext({ endpointConfigs = {} } = {}) {
  const mockReadConfigFile = createMockReadConfigFile(endpointConfigs);
  const context = testContext({
    connections,
    operators,
    logger,
    readConfigFile: mockReadConfigFile,
    secrets,
    session: { user: { id: 'user_1' } },
  });
  context.blockId = 'blockId';
  context.pageId = 'pageId';
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('basic endpoint call stores return value in caller steps', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: {
          ':return': { result: 'from_target' },
        },
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({
    call_target: { result: 'from_target' },
  });
});

test('payload is passed to target endpoint', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: {
          ':return': { received: { _payload: 'input_key' } },
        },
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
      payload: { input_key: 'hello' },
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({
    call_target: { received: 'hello' },
  });
});

test('context isolation - target steps do not leak into caller', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: [
          {
            id: 'request:target_endpoint:internal_step',
            stepId: 'internal_step',
            type: 'TestRequest',
            connectionId: 'test',
            properties: { response: 'internal_value' },
          },
          {
            ':return': { _step: 'internal_step' },
          },
        ],
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  // Only the return value appears, not internal steps
  expect(routineContext.steps).toEqual({
    call_target: 'internal_value',
  });
  // internal_step does NOT appear in caller's steps
  expect(routineContext.steps.internal_step).toBeUndefined();
});

test('no return stores null as step result', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: [
          {
            id: 'request:target_endpoint:some_step',
            stepId: 'some_step',
            type: 'TestRequest',
            connectionId: 'test',
            properties: { response: 'value' },
          },
        ],
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({
    call_target: null,
  });
});

test('error in target endpoint propagates to caller', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: {
          ':throw': 'Target failed',
        },
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
    },
  };

  // Error is caught by runRoutine's try/catch
  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('error');
});

test('recursion limit throws at depth 10', async () => {
  // Create an endpoint that calls itself (simulated via depth tracking)
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: { ':return': 'ok' },
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 10, // Already at max depth
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('error');
  expect(res.error).toBeInstanceOf(ConfigError);
  expect(res.error.message).toContain('depth exceeded maximum of 10');
});

test('endpoint call with _step operator in payload', async () => {
  const context = createTestContext({
    endpointConfigs: {
      target_endpoint: {
        endpointId: 'target_endpoint',
        type: 'Api',
        routine: {
          ':return': { _payload: 'data' },
        },
      },
    },
  });

  const routineContext = {
    steps: { previous_step: { id: 42 } },
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:caller:call_target',
    stepId: 'call_target',
    type: 'CallApi',
    properties: {
      endpointId: 'target_endpoint',
      payload: { data: { _step: 'previous_step.id' } },
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({
    previous_step: { id: 42 },
    call_target: 42,
  });
});

test('endpoint call increments depth for child', async () => {
  // Nested call: endpoint A calls endpoint B which calls endpoint C
  const context = createTestContext({
    endpointConfigs: {
      endpoint_b: {
        endpointId: 'endpoint_b',
        type: 'Api',
        routine: [
          {
            id: 'endpoint:endpoint_b:call_c',
            stepId: 'call_c',
            type: 'CallApi',
            properties: {
              endpointId: 'endpoint_c',
            },
          },
          { ':return': { from_b: true, c_result: { _step: 'call_c' } } },
        ],
      },
      endpoint_c: {
        endpointId: 'endpoint_c',
        type: 'Api',
        routine: { ':return': 'from_c' },
      },
    },
  });

  const routineContext = {
    steps: {},
    payload: {},
    arrayIndices: [],
    items: {},
    endpointDepth: 0,
  };

  const step = {
    id: 'endpoint:endpoint_a:call_b',
    stepId: 'call_b',
    type: 'CallApi',
    properties: {
      endpointId: 'endpoint_b',
    },
  };

  const res = await runRoutine(context, routineContext, { routine: step });
  expect(res.status).toBe('continue');
  expect(routineContext.steps).toEqual({
    call_b: { from_b: true, c_result: 'from_c' },
  });
});
