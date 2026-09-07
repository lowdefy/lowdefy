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
  expect(() => buildApi({ components, context })).toThrow('Api is not an array.');
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
    'Endpoint id is not a string at endpoint 0.'
  );
});

test('duplicate api endpoint ids', () => {
  const components = {
    api: [
      {
        id: 'test_duplicate_id',
        type: 'Api',
        routine: [],
      },
      {
        id: 'test_duplicate_id',
        type: 'Api',
        routine: [],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Duplicate endpointId "test_duplicate_id".'
  );
});

test('api endpoint id contains invalid characters', () => {
  const components = {
    api: [
      {
        id: 'api1.test',
        type: 1,
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint id "api1.test" contains invalid characters.'
  );
});

test('api endpoint id is a reserved name', () => {
  const components = {
    api: [
      {
        id: '__proto__',
        type: 'Api',
        routine: [],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint id "__proto__" is a reserved name and cannot be used as an id.'
  );
});

test('api step id is a reserved name', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [{ id: 'constructor' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Step id "constructor" at endpoint "api1" is a reserved name and cannot be used as an id.'
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
    'Endpoint type is not defined at "api1".'
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
    'Endpoint type is not a string at "api1".'
  );
});

test('invalid endpoint type throws', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'InvalidType',
        routine: [],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint type "InvalidType" is not valid at "api1". Must be one of: Api, InternalApi.'
  );
});

test('InternalApi endpoint type is valid', () => {
  const components = {
    api: [
      {
        id: 'internal_api1',
        type: 'InternalApi',
        routine: [],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: [
      {
        endpointId: 'internal_api1',
        id: 'endpoint:internal_api1',
        routine: [],
        type: 'InternalApi',
      },
    ],
  });
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

test('api endpoint schedules pass through to the artifact', () => {
  const components = {
    api: [
      {
        id: 'scheduled_api',
        type: 'Api',
        routine: [],
        schedules: [
          { cron: '0 6 * * *', payload: { mode: 'full' } },
          { cron: '*/15 * * * *', payload: { mode: 'incremental' } },
        ],
      },
    ],
  };
  const res = buildApi({ components, context });
  expect(res.api[0].schedules).toEqual([
    { cron: '0 6 * * *', payload: { mode: 'full' } },
    { cron: '*/15 * * * *', payload: { mode: 'incremental' } },
  ]);
});

test('api endpoint with invalid cron expression throws', () => {
  const components = {
    api: [
      {
        id: 'scheduled_api',
        type: 'Api',
        routine: [],
        schedules: [{ cron: '0 6 * * MON' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint schedule 0 cron "0 6 * * MON" is invalid at "scheduled_api"'
  );
});

test('api endpoint with duplicate cron expressions throws', () => {
  const components = {
    api: [
      {
        id: 'scheduled_api',
        type: 'Api',
        routine: [],
        schedules: [{ cron: '0 6 * * *' }, { cron: '0 6 * * *' }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint schedule 1 has duplicate cron "0 6 * * *" at "scheduled_api".'
  );
});

test('api endpoint schedules is not an array throws', () => {
  const components = {
    api: [
      {
        id: 'scheduled_api',
        type: 'Api',
        routine: [],
        schedules: { cron: '0 6 * * *' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint schedules is not an array at "scheduled_api".'
  );
});
