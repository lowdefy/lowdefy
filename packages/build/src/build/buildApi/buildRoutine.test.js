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
        stages: [],
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
