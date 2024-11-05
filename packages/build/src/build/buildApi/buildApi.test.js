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

test('no api defined', () => {
  const components = {};
  const res = buildApi({ components, context });
  expect(res.api).toBe(undefined);
});

test('api is not an array', () => {
  const components = {
    api: 'api',
  };
  expect(() => buildApi({ components, context })).toThrow('Api is not an array. Received "api".');
});

test('api endpoint does not have an id', () => {
  const components = {
    api: [
      {
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Endpoint id missing at endpoint 0.');
});

test('api endpoint id is not a string', () => {
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

test('duplicate api endpoint ids', () => {
  const components = {
    api: [
      {
        id: 'api_1',
        type: 'Api',
        routine: [],
      },
      {
        id: 'api_1',
        type: 'Api',
        routine: [],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Duplicate endpointId "api_1".');
});

test('api endpoint id contains "."', () => {
  const components = {
    api: [
      {
        id: 'api1.test',
        type: 1,
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    `Endpoint id "api1.test" at endpoint "api1.test" should not include a period (".").`
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

test('valid api endpoint', () => {
  const components = {
    api: [
      {
        id: 'valid_api1',
        type: 'Api',
        routine: [],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        endpointId: 'valid_api1',
        id: 'endpoint:valid_api1',
        routine: [],
        type: 'Api',
      },
    ],
  });
});
