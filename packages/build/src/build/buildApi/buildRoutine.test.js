/*
  Copyright 2020-2024 Lowdefy, Inc

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

import buildApi from './buildApi.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('no routine on api endpoint', () => {
  const components = {
    api: [
      {
        id: 'test_no_routine',
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Routine at test_no_routine on endpoint test_no_routine is not an array or object. Received "undefined"'
  );
});

test('empty routine on api endpoint', () => {
  const components = {
    api: [
      {
        id: 'test_empty_routine',
        type: 'Api',
        routine: [],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_empty_routine',
        endpointId: 'test_empty_routine',
        type: 'Api',
        routine: [],
      },
    ],
  });
});

test('empty routine object on api endpoint', () => {
  const components = {
    api: [
      {
        id: 'test_empty_routine_object',
        type: 'Api',
        routine: {},
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step is not defined at endpoint "test_empty_routine_object"'
  );
});

test('routine not an array or object', () => {
  const components = {
    api: [
      {
        id: 'test_routine_not_array',
        type: 'Api',
        routine: 'invalid_type',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Routine at test_routine_not_array on endpoint test_routine_not_array is not an array or object. Received "invalid_type"'
  );
});

// Routines with steps and controls working
test('valid routine with :if', () => {
  const components = {
    api: [
      {
        id: 'test_valid_if',
        type: 'Api',
        routine: [
          {
            ':if': true,
            ':then': { id: 'then_step_1', type: 'MongoDBInsertOne', connectionId: 'connection' },
            ':else': { id: 'else_step_2', type: 'MongoDBUpdateOne', connectionId: 'connection' },
          },
          { id: 'step_3', type: 'MongoDBAggregation', connectionId: 'connection' },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_valid_if',
        type: 'Api',
        endpointId: 'test_valid_if',
        routine: [
          {
            ':if': true,
            ':then': {
              id: 'request:test_valid_if:then_step_1',
              endpointId: 'test_valid_if',
              requestId: 'then_step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
            ':else': {
              id: 'request:test_valid_if:else_step_2',
              endpointId: 'test_valid_if',
              requestId: 'else_step_2',
              type: 'MongoDBUpdateOne',
              connectionId: 'connection',
            },
          },
          {
            id: 'request:test_valid_if:step_3',
            endpointId: 'test_valid_if',
            requestId: 'step_3',
            type: 'MongoDBAggregation',
            connectionId: 'connection',
          },
        ],
      },
    ],
  });
});

test('valid routine with :switch', () => {
  const components = {
    api: [
      {
        id: 'test_valid_switch',
        type: 'Api',
        routine: [
          {
            ':switch': [
              {
                ':case': 1,
                ':then': {
                  id: 'case_1_step_1',
                  type: 'MongoDBInsertOne',
                  connectionId: 'connection',
                },
              },
              {
                ':case': 2,
                ':then': {
                  id: 'case_2_step_2',
                  type: 'MongoDBUpdateOne',
                  connectionId: 'connection',
                },
              },
            ],
            ':default': {
              id: 'default_step_3',
              type: 'MongoDBAggregation',
              connectionId: 'connection',
            },
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_valid_switch',
        type: 'Api',
        endpointId: 'test_valid_switch',
        routine: [
          {
            ':switch': [
              {
                ':case': 1,
                ':then': {
                  id: 'request:test_valid_switch:case_1_step_1',
                  endpointId: 'test_valid_switch',
                  requestId: 'case_1_step_1',
                  type: 'MongoDBInsertOne',
                  connectionId: 'connection',
                },
              },
              {
                ':case': 2,
                ':then': {
                  id: 'request:test_valid_switch:case_2_step_2',
                  endpointId: 'test_valid_switch',
                  requestId: 'case_2_step_2',
                  type: 'MongoDBUpdateOne',
                  connectionId: 'connection',
                },
              },
            ],
            ':default': {
              id: 'request:test_valid_switch:default_step_3',
              endpointId: 'test_valid_switch',
              requestId: 'default_step_3',
              type: 'MongoDBAggregation',
              connectionId: 'connection',
            },
          },
        ],
      },
    ],
  });
});

test('valid routine with :try object', () => {
  const components = {
    api: [
      {
        id: 'test_valid_try',
        type: 'Api',
        routine: {
          ':try': [
            { id: 'try_step_1', type: 'MongoDBUpdateMany', connectionId: 'connection' },
            { id: 'try_step_2', type: 'MongoDBInsertMany', connectionId: 'connection' },
          ],
          ':catch': { id: 'catch_step_1', type: 'MongoDBInsertOne', connectionId: 'connection' },
        },
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_valid_try',
        type: 'Api',
        endpointId: 'test_valid_try',
        routine: {
          ':try': [
            {
              id: 'request:test_valid_try:try_step_1',
              endpointId: 'test_valid_try',
              requestId: 'try_step_1',
              type: 'MongoDBUpdateMany',
              connectionId: 'connection',
            },
            {
              id: 'request:test_valid_try:try_step_2',
              endpointId: 'test_valid_try',
              requestId: 'try_step_2',
              type: 'MongoDBInsertMany',
              connectionId: 'connection',
            },
          ],
          ':catch': {
            id: 'request:test_valid_try:catch_step_1',
            endpointId: 'test_valid_try',
            requestId: 'catch_step_1',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        },
      },
    ],
  });
});

test('count operators', () => {
  const components = {
    api: [
      {
        id: 'test_count_operators',
        type: 'Api',
        routine: [
          {
            ':if': {
              _not: {
                _user: 'registered',
              },
            },
            ':then': [
              {
                id: 'register_user',
                type: 'MongoDBInsertOne',
                connectionId: 'connection',
              },
              {
                id: 'event_register_user',
                type: 'MongoDBInsertOne',
                connectionId: 'connection',
                properties: { payload: { user_id: { _step: 'register_user.insertedId' } } },
              },
            ],
          },
          {
            ':if': { _payload: 'return_default' },
            ':then': {
              ':return': null,
            },
            ':else': {
              ':return': {
                _step: 'register_user.insertedId',
              },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _step: 2,
    _not: 1,
    _user: 1,
    _payload: 1,
  });
});
