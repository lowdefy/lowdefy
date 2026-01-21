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
    'Step id is not a string at endpoint "test_step_id_not_string". Received true.'
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
    'Step type is not a string at "stepId" on endpoint "test_step_type_not_string". Received 1.'
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
    'Step connectionId is not a string at endpoint "test_no_connectionId". Received false.'
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
              requestId: 'step_1',
              type: 'MongoDBInsertOne',
              connectionId: 'connection',
            },
          ],
          [
            {
              id: 'request:test_valid_routine_steps_nested:step_2',
              endpointId: 'test_valid_routine_steps_nested',
              requestId: 'step_2',
              type: 'MongoDBUpdateOne',
              connectionId: 'connection',
            },
            [
              {
                id: 'request:test_valid_routine_steps_nested:step_3',
                endpointId: 'test_valid_routine_steps_nested',
                requestId: 'step_3',
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
                  requestId: 'step_4',
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
