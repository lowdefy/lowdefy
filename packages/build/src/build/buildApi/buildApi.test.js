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

test('buildApi no api', () => {
  const components = {};
  const res = buildApi({ components, context });
  expect(res.api).toBe(undefined);
});

test('buildApi api not an array', () => {
  const components = {
    api: 'api',
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: 'api',
  });
});

test('endpoint does not have an id', () => {
  const components = {
    api: [
      {
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Endpoint id missing at endpoint 0.');
});

test('endpoint id is not a string', () => {
  const components = {
    api: [
      {
        id: true,
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint id is not a string at endpoint 0. Received true.'
  );
});

test('Throw on duplicate endpoint ids', () => {
  const components = {
    api: [
      {
        id: 'api_1',
        type: 'Api',
        stages: [],
      },
      {
        id: 'api_1',
        type: 'Api',
        stages: [],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Duplicate endpointId "api_1".');
});

test('stage does not have an id', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        stages: [
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
        stages: [
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

test('api type missing', () => {
  const components = {
    api: [
      {
        id: 'api1',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint type is not defined at "api1" on endpoint "api1".'
  );
});

test('api type not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 1,
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint type is not a string at "api1" on endpoint "api1". Received 1.'
  );
});
