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

import buildApi from './buildApi.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('step does not have an id', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_missing_step_id',
        type: 'Api',
        routine: [
          {
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id missing at endpoint "test_missing_step_id".'
  );
});

test('step id is not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_id_not_string',
        type: 'Api',
        routine: [
          {
            id: true,
            type: 'MongoDBUpdateOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id is not a string at endpoint "test_step_id_not_string".'
  );
});

test('step type not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_step_type_not_string',
        type: 'Api',
        routine: [
          {
            id: 'stepId',
            type: 1,
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step type is not a string at "stepId" on endpoint "test_step_type_not_string".'
  );
});

// Removed for now because step might be used in mutually exclusive branches of a routine (if or switch)

// test('throw on duplicate step ids', () => {
//   const context = testContext({ logger });
//   const components = {
//     api: [
//       {
//         id: 'test_duplicate_step_ids',
//         type: 'Api',
//         routine: [
//           {
//             id: 'step_1',
//             type: 'MongoDBInsertOne',
//             connectionId: 'connection',
//           },
//           {
//             id: 'step_1',
//             type: 'MongoDBInsertOne',
//             connectionId: 'connection',
//           },
//         ],
//       },
//     ],
//   };
//   expect(() => buildApi({ components, context })).toThrow(
//     'Duplicate stepId "step_1" on endpoint "test_duplicate_step_ids"'
//   );
// });

test('no connectionId on step', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_no_connectionId',
        type: 'Api',
        routine: [{ id: 'step_id', type: 'MongoDBUpdateOne' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step connectionId missing at endpoint "test_no_connectionId".'
  );
});

test('connectionId is not a string', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_no_connectionId',
        type: 'Api',
        routine: [{ id: 'step_id', type: 'MongoDBUpdateOne', connectionId: false }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step connectionId is not a string at endpoint "test_no_connectionId".'
  );
});
test('valid routine step config nested array', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_valid_routine_steps_nested',
        type: 'Api',
        routine: [
          [
            {
              id: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            { id: 'step_2', type: 'MongoDBUpdateOne', connectionId: 'connection' },
            [{ id: 'step_3', type: 'MongoDBAggregation', connectionId: 'connection' }],
          ],
          [[[{ id: 'step_4', type: 'MongoDBInsertMany', connectionId: 'connection' }]]],
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:test_valid_routine_steps_nested',
        endpointId: 'test_valid_routine_steps_nested',
        type: 'Api',
        routine: [
          [
            {
              id: 'request:test_valid_routine_steps_nested:step_1',
              endpointId: 'test_valid_routine_steps_nested',
              stepId: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            {
              id: 'request:test_valid_routine_steps_nested:step_2',
              endpointId: 'test_valid_routine_steps_nested',
              stepId: 'step_2',
              type: 'MongoDBUpdateOne',
              connectionId: 'connection',
            },
            [
              {
                id: 'request:test_valid_routine_steps_nested:step_3',
                endpointId: 'test_valid_routine_steps_nested',
                stepId: 'step_3',
                type: 'MongoDBAggregation',
                connectionId: 'connection',
              },
            ],
          ],
          [
            [
              [
                {
                  id: 'request:test_valid_routine_steps_nested:step_4',
                  endpointId: 'test_valid_routine_steps_nested',
                  stepId: 'step_4',
                  type: 'MongoDBInsertMany',
                  connectionId: 'connection',
                },
              ],
            ],
          ],
        ],
      },
    ],
  });
});

test('CallApi step builds with endpoint prefix', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_step',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
              payload: { key: 'value' },
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
        id: 'endpoint:test_callapi_step',
        endpointId: 'test_callapi_step',
        type: 'Api',
        routine: [
          {
            id: 'endpoint:test_callapi_step:call_other',
            endpointId: 'test_callapi_step',
            stepId: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
              payload: { key: 'value' },
            },
          },
        ],
      },
    ],
  });
});

test('CallApi step without properties.endpointId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_no_endpoint',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {},
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint step "call_other" at endpoint "test_callapi_no_endpoint" requires properties.endpointId.'
  );
});

test('CallApi step with connectionId throws', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_with_connection',
        type: 'Api',
        routine: [
          {
            id: 'call_other',
            type: 'CallApi',
            connectionId: 'test_connection',
            properties: {
              endpointId: 'other_endpoint',
            },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint step "call_other" at endpoint "test_callapi_with_connection" should not have a connectionId.'
  );
});

test('CallApi step is not counted in typeCounters.requests', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_callapi_no_count',
        type: 'Api',
        routine: [
          {
            id: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
          {
            id: 'call_other',
            type: 'CallApi',
            properties: {
              endpointId: 'other_endpoint',
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 1,
  });
});

test('mixed request and CallApi steps in routine', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_mixed_steps',
        type: 'Api',
        routine: [
          {
            id: 'db_query',
            type: 'MongoDBFind',
            connectionId: 'connection',
          },
          {
            id: 'call_processor',
            type: 'CallApi',
            properties: {
              endpointId: 'processor_endpoint',
              payload: { data: { _step: 'db_query' } },
            },
          },
          {
            id: 'db_insert',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].routine[0].id).toBe('request:test_mixed_steps:db_query');
  expect(res.api[0].routine[1].id).toBe('endpoint:test_mixed_steps:call_processor');
  expect(res.api[0].routine[2].id).toBe('request:test_mixed_steps:db_insert');
});

test('count steps', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_count_steps',
        type: 'Api',
        routine: [
          [
            {
              id: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            { id: 'step_2', type: 'MongoDBUpdateOne', connectionId: 'connection' },
            [{ id: 'step_3', type: 'MongoDBAggregation', connectionId: 'connection' }],
          ],
          { id: 'step_4', type: 'MongoDBInsertOne', connectionId: 'connection' },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.requests.getCounts()).toEqual({
    MongoDBInsertOne: 2,
    MongoDBUpdateOne: 1,
    MongoDBAggregation: 1,
  });
});
