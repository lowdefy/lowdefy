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
import testContext from '../../test/testContext.js';

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

test('step does not have an id', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            type: 'MongoDBInsertOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Step id missing at endpoint "api1".');
});

test('step id is not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: true,
            type: 'MongoDBUpdateOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id is not a string at endpoint "api1". Received true.'
  );
});

test('step type not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'stepId',
            type: 1,
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step type is not a string at "stepId" on endpoint "api1". Received 1.'
  );
});

test('throw on duplicate step ids', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'step_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'step_1',
            type: 'MongoDBInsertOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Duplicate stepId "step_1" on endpoint "api1"'
  );
});

test('valid routine step config', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'step_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'step_2',
            type: 'MongoDBUpdateOne',
          },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:api1',
        endpointId: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'step:api1:step_1',
            endpointId: 'api1',
            stepId: 'step_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'step:api1:step_2',
            endpointId: 'api1',
            stepId: 'step_2',
            type: 'MongoDBUpdateOne',
          },
        ],
      },
    ],
  });
});

test('valid routine step config nested array', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          [
            {
              id: 'step_1',
              type: 'MongoDBInsertOne',
            },
          ],
          [
            { id: 'step_2', type: 'MongoDBUpdateOne' },
            [{ id: 'step_3', type: 'MongoDBAggregation' }],
          ],
          [[[{ id: 'step_4', type: 'MongoDBInsertMany' }]]],
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:api1',
        endpointId: 'api1',
        type: 'Api',
        routine: [
          [
            {
              id: 'step:api1:step_1',
              endpointId: 'api1',
              stepId: 'step_1',
              type: 'MongoDBInsertOne',
            },
          ],
          [
            {
              id: 'step:api1:step_2',
              endpointId: 'api1',
              stepId: 'step_2',
              type: 'MongoDBUpdateOne',
            },
            [
              {
                id: 'step:api1:step_3',
                endpointId: 'api1',
                stepId: 'step_3',
                type: 'MongoDBAggregation',
              },
            ],
          ],
          [
            [
              [
                {
                  id: 'step:api1:step_4',
                  endpointId: 'api1',
                  stepId: 'step_4',
                  type: 'MongoDBInsertMany',
                },
              ],
            ],
          ],
        ],
      },
    ],
  });
});
