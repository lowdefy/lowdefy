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

// End-to-end checks that every routine step evaluates operators against the full routine frame
// (payload, state, steps, items, loop array indices), including inside _function bodies. These run
// the real server operators through runRoutine, so a step handler or parser that drops part of the
// frame fails here even when the unit tests of each piece still pass.

import { jest } from '@jest/globals';
import { operatorsServer } from '@lowdefy/operators-js';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import runRoutine from './runRoutine.js';
import testContext from '../../test/testContext.js';

const mockEcho = jest.fn(({ connection, request }) => ({ connection, request }));
mockEcho.schema = {};
mockEcho.meta = { checkRead: false, checkWrite: false };

const connections = {
  EchoConnection: {
    schema: {},
    requests: { Echo: mockEcho },
  },
};

function createContext({ connectionProperties = {} } = {}) {
  const context = testContext({
    connections,
    operators: operatorsServer,
    readConfigFile: jest.fn(async (path) => {
      if (path === 'connections/echo.json') {
        return {
          id: 'connection:echo',
          type: 'EchoConnection',
          connectionId: 'echo',
          properties: connectionProperties,
        };
      }
      return null;
    }),
    session: { user: { id: 'user_1' } },
  });
  context.endpointId = 'endpointId';
  context.evaluateOperators = createEvaluateOperators(context);
  return context;
}

function createRoutineContext({ payload = {} } = {}) {
  return {
    arrayIndices: [],
    endpointDepth: 0,
    items: {},
    payload,
    state: {},
    steps: {},
  };
}

function echoStep({ stepId, properties }) {
  return {
    id: `request:endpointId:${stepId}`,
    type: 'Echo',
    stepId,
    connectionId: 'echo',
    properties,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('_function in :set_state reads routine state', async () => {
  const context = createContext();
  const routineContext = createRoutineContext();
  const routine = [
    { ':set_state': { subscribers: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], current_ids: ['a'] } },
    {
      ':set_state': {
        added: {
          '_array.filter': [
            { _state: 'subscribers' },
            {
              _function: {
                __not: {
                  '__array.includes': [{ __state: 'current_ids' }, { __args: '0.id' }],
                },
              },
            },
          ],
        },
      },
    },
    { ':return': { _state: 'added' } },
  ];

  const res = await runRoutine(context, routineContext, { routine });

  expect(res).toEqual({ status: 'return', response: [{ id: 'b' }, { id: 'c' }] });
});

test('_function in a :for step reads the loop item', async () => {
  const context = createContext();
  const routineContext = createRoutineContext();
  const routine = {
    ':for': 'threshold',
    ':in': [1, 2],
    ':do': echoStep({
      stepId: 'above',
      properties: {
        values: {
          '_array.filter': [
            [1, 2, 3],
            { _function: { __gt: [{ __args: 0 }, { __item: 'threshold' }] } },
          ],
        },
      },
    }),
  };

  const res = await runRoutine(context, routineContext, { routine });

  expect(res.status).toEqual('continue');
  expect(routineContext.steps.above[0].request).toEqual({ values: [2, 3] });
  expect(routineContext.steps.above[1].request).toEqual({ values: [3] });
});

test('ValidateSchema step properties read routine state', async () => {
  const context = createContext();
  const routineContext = createRoutineContext({ payload: { body: { name: 42 } } });
  const routine = [
    {
      ':set_state': {
        schema: { type: 'object', properties: { name: { type: 'string' } } },
      },
    },
    {
      id: 'validate:endpointId:check',
      stepId: 'check',
      type: 'ValidateSchema',
      properties: {
        schema: { _state: 'schema' },
        data: { _payload: 'body' },
        throwOnInvalid: false,
      },
    },
  ];

  const res = await runRoutine(context, routineContext, { routine });

  expect(res.status).toEqual('continue');
  expect(routineContext.steps.check.valid).toBe(false);
  expect(routineContext.steps.check.errors[0].instancePath).toEqual('/name');
});

test('connection properties read the loop item inside :for', async () => {
  const context = createContext({ connectionProperties: { tenant: { _item: 'tenant.id' } } });
  const routineContext = createRoutineContext();
  const routine = {
    ':for': 'tenant',
    ':in': [{ id: 't1' }, { id: 't2' }],
    ':do': echoStep({ stepId: 'call', properties: {} }),
  };

  const res = await runRoutine(context, routineContext, { routine });

  expect(res.status).toEqual('continue');
  expect(routineContext.steps.call[0].connection).toEqual({ tenant: 't1' });
  expect(routineContext.steps.call[1].connection).toEqual({ tenant: 't2' });
});

test('$ in _step and _state paths resolves to the current :for index', async () => {
  const context = createContext();
  const routineContext = createRoutineContext();
  const routine = [
    { ':set_state': { labels: ['first', 'second'] } },
    {
      ':for': 'value',
      ':in': [10, 20],
      ':do': [
        echoStep({ stepId: 'fetch', properties: { value: { _item: 'value' } } }),
        echoStep({
          stepId: 'use',
          properties: {
            fetched: { _step: 'fetch.$.request.value' },
            label: { _state: 'labels.$' },
            viaFunction: { _function: { __state: 'labels.$' } },
          },
        }),
      ],
    },
  ];

  const res = await runRoutine(context, routineContext, { routine });

  expect(res.status).toEqual('continue');
  expect(routineContext.steps.use[0].request.fetched).toEqual(10);
  expect(routineContext.steps.use[0].request.label).toEqual('first');
  expect(routineContext.steps.use[0].request.viaFunction()).toEqual('first');
  expect(routineContext.steps.use[1].request.fetched).toEqual(20);
  expect(routineContext.steps.use[1].request.label).toEqual('second');
  expect(routineContext.steps.use[1].request.viaFunction()).toEqual('second');
});
