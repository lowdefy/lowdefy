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

import validatePayloadReferences from './validatePayloadReferences.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validatePayloadReferences no warnings for valid references', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {
          userId: { _state: 'selectedUser' },
        },
        properties: {
          query: {
            id: { _payload: 'userId' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validatePayloadReferences warns for undefined payload key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {
          userId: { _state: 'selectedUser' },
        },
        properties: {
          query: {
            id: { _payload: 'undefinedKey' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "undefinedKey"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('request "getUser"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('page "page_1"');
});

test('validatePayloadReferences warns for nested path with undefined top-level key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {
          userId: { _state: 'selectedUser' },
        },
        properties: {
          query: {
            name: { _payload: 'user.profile.name' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "user"');
});

test('validatePayloadReferences allows nested path with valid top-level key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {
          user: { _state: 'selectedUser' },
        },
        properties: {
          query: {
            name: { _payload: 'user.profile.name' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validatePayloadReferences handles object param format', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {
          userId: { _state: 'selectedUser' },
        },
        properties: {
          query: {
            id: {
              _payload: {
                key: 'undefinedKey.nested',
                default: 'fallback',
              },
            },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "undefinedKey"');
});

test('validatePayloadReferences skips requests with no payload', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {},
        properties: {
          query: {
            id: { _payload: 'userId' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  // No warning because payload is empty - likely using _payload: true for all
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validatePayloadReferences handles multiple requests', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: { userId: 'test' },
        properties: {
          query: { id: { _payload: 'userId' } },
        },
      },
      {
        requestId: 'getOrder',
        payload: { orderId: 'test' },
        properties: {
          query: { id: { _payload: 'wrongKey' } },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('request "getOrder"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "wrongKey"');
});

test('validatePayloadReferences deduplicates warnings for same key in same request', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: { userId: 'test' },
        properties: {
          query: {
            field1: { _payload: 'missing' },
            field2: { _payload: 'missing' },
            field3: { _payload: 'missing.nested' },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "missing"');
});

test('validatePayloadReferences handles pages with no requests', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validatePayloadReferences finds references in nested properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'complexRequest',
        payload: { validKey: 'test' },
        properties: {
          deeply: {
            nested: {
              structure: {
                value: { _payload: 'invalidKey' },
              },
            },
          },
        },
      },
    ],
  };
  validatePayloadReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_payload references "invalidKey"');
});
