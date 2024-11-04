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
  expect(() => buildApi({ components, context })).toThrow('Step is not defined at endpoint "1"');
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

// Routines with steps and controls working
test('valid routine with :if', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            ':if': true,
            ':then': { id: 'then_step_1', type: 'MongoDBInsertOne' },
            ':else': { id: 'else_step_2', type: 'MongoDBUpdateOne' },
          },
          { id: 'step_3', type: 'MongoDBAggregation' },
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
              id: 'step:api1:then_step_1',
              endpointId: 'api1',
              stepId: 'then_step_1',
              type: 'MongoDBInsertOne',
            },
            ':else': {
              id: 'step:api1:else_step_2',
              endpointId: 'api1',
              stepId: 'else_step_2',
              type: 'MongoDBUpdateOne',
            },
          },
          {
            id: 'step:api1:step_3',
            endpointId: 'api1',
            stepId: 'step_3',
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
              { ':case': 1, ':then': { id: 'case_1_step_1', type: 'MongoDBInsertOne' } },
              { ':case': 2, ':then': { id: 'case_2_step_2', type: 'MongoDBUpdateOne' } },
            ],
            ':default': { id: 'default_step_3', type: 'MongoDBAggregation' },
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
                  id: 'step:api1:case_1_step_1',
                  endpointId: 'api1',
                  stepId: 'case_1_step_1',
                  type: 'MongoDBInsertOne',
                },
              },
              {
                ':case': 2,
                ':then': {
                  id: 'step:api1:case_2_step_2',
                  endpointId: 'api1',
                  stepId: 'case_2_step_2',
                  type: 'MongoDBUpdateOne',
                },
              },
            ],
            ':default': {
              id: 'step:api1:default_step_3',
              endpointId: 'api1',
              stepId: 'default_step_3',
              type: 'MongoDBAggregation',
            },
          },
        ],
      },
    ],
  });
});
