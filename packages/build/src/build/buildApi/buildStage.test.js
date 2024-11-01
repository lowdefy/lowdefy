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

test('stage does not have an id', () => {
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
  expect(() => buildApi({ components, context })).toThrow('Stage id missing at endpoint "api1".');
});

test('stage id is not a string', () => {
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
    'Stage id is not a string at endpoint "api1". Received true.'
  );
});

test('stage type not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'stageId',
            type: 1,
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Stage type is not a string at "stageId" on endpoint "api1". Received 1.'
  );
});

test('throw on duplicate stage ids', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'stage_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'stage_1',
            type: 'MongoDBInsertOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Duplicate stageId "stage_1" on endpoint "api1"'
  );
});

test('valid routine stage config', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            id: 'stage_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'stage_2',
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
            id: 'stage:api1:stage_1',
            endpointId: 'api1',
            stageId: 'stage_1',
            type: 'MongoDBInsertOne',
          },
          {
            id: 'stage:api1:stage_2',
            endpointId: 'api1',
            stageId: 'stage_2',
            type: 'MongoDBUpdateOne',
          },
        ],
      },
    ],
  });
});

test('valid routine stage config nested array', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          [
            {
              id: 'stage_1',
              type: 'MongoDBInsertOne',
            },
          ],
          [
            { id: 'stage_2', type: 'MongoDBUpdateOne' },
            [{ id: 'stage_3', type: 'MongoDBAggregation' }],
          ],
          [[[{ id: 'stage_4', type: 'MongoDBInsertMany' }]]],
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
              id: 'stage:api1:stage_1',
              endpointId: 'api1',
              stageId: 'stage_1',
              type: 'MongoDBInsertOne',
            },
          ],
          [
            {
              id: 'stage:api1:stage_2',
              endpointId: 'api1',
              stageId: 'stage_2',
              type: 'MongoDBUpdateOne',
            },
            [
              {
                id: 'stage:api1:stage_3',
                endpointId: 'api1',
                stageId: 'stage_3',
                type: 'MongoDBAggregation',
              },
            ],
          ],
          [
            [
              [
                {
                  id: 'stage:api1:stage_4',
                  endpointId: 'api1',
                  stageId: 'stage_4',
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
