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

test('no routine on api endpoint', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Routine at api1 on endpoint api1 is not an array or object. Received "undefined"'
  );
});

test('empty routine on api endpoint', () => {
  const components = {
    api: [
      {
        id: '1',
        type: 'Api',
        routine: [],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:1',
        endpointId: '1',
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
        id: '1',
        type: 'Api',
        routine: {},
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Stage is not defined at endpoint "1"');
});

test('routine not an array or object', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: 'api1',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Routine at api1 on endpoint api1 is not an array or object. Received "api1"'
  );
});

// Routines with stages and controls working
test('valid routine with :if', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            ':if': true,
            ':then': { id: 'then_stage_1', type: 'MongoDBInsertOne' },
            ':else': { id: 'else_stage_2', type: 'MongoDBUpdateOne' },
          },
          { id: 'stage_3', type: 'MongoDBAggregation' },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        id: 'endpoint:api1',
        type: 'Api',
        endpointId: 'api1',
        routine: [
          {
            ':if': true,
            ':then': {
              id: 'stage:api1:then_stage_1',
              endpointId: 'api1',
              stageId: 'then_stage_1',
              type: 'MongoDBInsertOne',
            },
            ':else': {
              id: 'stage:api1:else_stage_2',
              endpointId: 'api1',
              stageId: 'else_stage_2',
              type: 'MongoDBUpdateOne',
            },
          },
          {
            id: 'stage:api1:stage_3',
            endpointId: 'api1',
            stageId: 'stage_3',
            type: 'MongoDBAggregation',
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
        id: 'api1',
        type: 'Api',
        routine: [
          {
            ':switch': [
              { ':case': 1, ':then': { id: 'case_1_stage_1', type: 'MongoDBInsertOne' } },
              { ':case': 2, ':then': { id: 'case_2_stage_2', type: 'MongoDBUpdateOne' } },
            ],
            ':default': { id: 'default_stage_3', type: 'MongoDBAggregation' },
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
        type: 'Api',
        endpointId: 'api1',
        routine: [
          {
            ':switch': [
              {
                ':case': 1,
                ':then': {
                  id: 'stage:api1:case_1_stage_1',
                  endpointId: 'api1',
                  stageId: 'case_1_stage_1',
                  type: 'MongoDBInsertOne',
                },
              },
              {
                ':case': 2,
                ':then': {
                  id: 'stage:api1:case_2_stage_2',
                  endpointId: 'api1',
                  stageId: 'case_2_stage_2',
                  type: 'MongoDBUpdateOne',
                },
              },
            ],
            ':default': {
              id: 'stage:api1:default_stage_3',
              endpointId: 'api1',
              stageId: 'default_stage_3',
              type: 'MongoDBAggregation',
            },
          },
        ],
      },
    ],
  });
});
