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

const logger = {
  warn: mockLogWarn,
};

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validateStepReferences no warnings for valid references', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            id: 'step1',
            type: 'MongoDBFindOne',
            connectionId: 'db',
          },
          {
            id: 'step2',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              query: { id: { _step: 'step1.result' } },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStepReferences warns for undefined step reference', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            id: 'step1',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              query: { id: { _step: 'undefinedStep.result' } },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_step references "undefinedStep"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('endpoint "test_api"');
});

test('validateStepReferences finds step in control structure', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            ':if': { _eq: [true, true] },
            ':then': [
              {
                id: 'conditionalStep',
                type: 'MongoDBFindOne',
                connectionId: 'db',
              },
            ],
          },
          {
            id: 'step2',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              query: { id: { _step: 'conditionalStep.result' } },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  // Should not warn - step exists in :then branch
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStepReferences handles object param format', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            id: 'step1',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              query: {
                id: {
                  _step: {
                    key: 'missingStep.nested.value',
                    default: 'fallback',
                  },
                },
              },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_step references "missingStep"');
});

test('validateStepReferences deduplicates warnings for same step', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            id: 'step1',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              field1: { _step: 'missing' },
              field2: { _step: 'missing.nested' },
              field3: { _step: 'missing.other' },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_step references "missing"');
});

test('validateStepReferences handles empty routine', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStepReferences finds steps in nested control structures', () => {
  const context = testContext({ logger });
  const components = {
    api: [
      {
        id: 'test_api',
        type: 'Api',
        routine: [
          {
            ':try': [
              {
                ':if': true,
                ':then': [
                  {
                    id: 'deeplyNestedStep',
                    type: 'MongoDBFindOne',
                    connectionId: 'db',
                  },
                ],
              },
            ],
            ':catch': [],
          },
          {
            id: 'finalStep',
            type: 'MongoDBFindOne',
            connectionId: 'db',
            properties: {
              result: { _step: 'deeplyNestedStep' },
            },
          },
        ],
      },
    ],
  };
  buildApi({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});
