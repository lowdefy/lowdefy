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

test('invalid control', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':invalid': 'step' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Invalid control type(s) for endpoint api1.'
  );
});

test('missing required controls', () => {
  const components = {
    api: [
      {
        id: 'test_missing_control',
        type: 'Api',
        routine: { ':if': true },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Missing required control type(s) for endpoint test_missing_control.'
  );
});

test('throw more than one control', () => {
  const components = {
    api: [
      {
        id: 'test_multiple_controls',
        type: 'Api',
        routine: { ':if': true, ':then': [], ':try': [], ':catch': 'error' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'More than one control type found for endpoint test_multiple_controls.'
  );
});

test('throw invalid control with a valid control', () => {
  const components = {
    api: [
      {
        id: 'test_invalid_control',
        type: 'Api',
        routine: { ':if': true, ':then': [], ':invalid': [], ':catch': 'error' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Invalid control type(s) for endpoint test_invalid_control.'
  );
});

test('throw switch not an array', () => {
  const components = {
    api: [
      {
        id: 'test_invalid_switch',
        type: 'Api',
        routine: { ':switch': true },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Type given for :switch control is invalid at endpoint test_invalid_switch.'
  );
});

test('throw missing :case for :switch control', () => {
  const components = {
    api: [
      {
        id: 'test_missing_case',
        type: 'Api',
        routine: { ':switch': [{ ':then': {} }] },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Missing required control type(s) for endpoint test_missing_case.'
  );
});

test('count controls', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: [
          {
            ':try': [
              {
                ':try': {
                  ':try': {
                    id: 'test_count_controls',
                    type: 'MongoDBUpdateOne',
                    connectionId: 'connection',
                  },
                },
              },
            ],
            ':catch': {
              ':if': true,
              ':then': {
                ':if': false,
                ':then': [
                  { id: 'then_step_1', type: 'MongoDBInsertOne', connectionId: 'connection' },
                  { ':set_state': { result: { _step: 'then_step_1' } } },
                ],
              },
              ':else': [
                { id: 'else_step_1', type: 'MongoDBUpdateMany', connectionId: 'connection' },
              ],
            },
          },
          {
            ':return': 'return value',
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(context.typeCounters.controls.getCounts()).toEqual({
    ':try': 3,
    ':catch': 1,
    ':if': 2,
    ':then': 2,
    ':else': 1,
    ':return': 1,
    ':set_state': 1,
  });
});

test('parallel_for accepts :concurrency', () => {
  const components = {
    api: [
      {
        id: 'api_concurrency',
        type: 'Api',
        routine: [
          {
            ':parallel_for': 'item',
            ':in': [1, 2, 3],
            ':concurrency': 2,
            ':do': { id: 'step_a', type: 'MongoDBInsertOne', connectionId: 'connection' },
          },
          {
            ':parallel_for': 'item',
            ':in': [1, 2, 3],
            ':concurrency': { _payload: 'concurrency' },
            ':do': { id: 'step_b', type: 'MongoDBInsertOne', connectionId: 'connection' },
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).not.toThrow();
});

test.each([0, -2, 2.5, 'many', true])('parallel_for throws for :concurrency %p', (concurrency) => {
  const components = {
    api: [
      {
        id: 'api_bad_concurrency',
        type: 'Api',
        routine: {
          ':parallel_for': 'item',
          ':in': [1, 2, 3],
          ':concurrency': concurrency,
          ':do': { id: 'step_a', type: 'MongoDBInsertOne', connectionId: 'connection' },
        },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    ':concurrency in :parallel_for must be a positive integer at endpoint api_bad_concurrency.'
  );
});

test(':reject :status and :body build in a webhook endpoint and an InternalApi endpoint', () => {
  const components = {
    api: [
      {
        id: 'hook',
        type: 'Api',
        webhook: true,
        routine: { ':reject': 'Not found', ':status': 404, ':body': { error: 'not_found' } },
      },
      {
        id: 'worker',
        type: 'InternalApi',
        routine: { ':reject': 'Too large', ':status': { _if: { test: true, then: 413 } } },
      },
    ],
  };
  expect(() => buildApi({ components, context })).not.toThrow();
});

test(':reject :status on an endpoint no webhook answers for is a build error', () => {
  const components = {
    api: [
      {
        id: 'plain',
        type: 'Api',
        routine: [{ ':reject': 'Not found', ':status': 404, ':body': {} }],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    ':reject in endpoint plain sets :status and :body, which only a webhook endpoint, or an InternalApi endpoint a webhook calls, answers with.'
  );
});

test(':reject :status outside 400 to 499 is a build error', () => {
  const components = {
    api: [{ id: 'hook', type: 'Api', webhook: true, routine: { ':reject': 'x', ':status': 500 } }],
  };
  expect(() => buildApi({ components, context })).toThrow(
    ':status in :reject must be an integer from 400 to 499 at endpoint hook.'
  );
});
