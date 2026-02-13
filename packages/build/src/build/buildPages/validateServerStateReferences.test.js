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

import validateServerStateReferences from './validateServerStateReferences.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validateServerStateReferences warns when _state used in request properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {},
        properties: {
          query: {
            name: { _state: 'userName' },
          },
        },
      },
    ],
  };
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state is not available in request properties');
  expect(mockLogWarn.mock.calls[0][0]).toContain('request "getUser"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('page "page_1"');
});

test('validateServerStateReferences does not warn when _state used in payload', () => {
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
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateServerStateReferences warns for deeply nested _state in properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'insertData',
        payload: {},
        properties: {
          doc: {
            nested: {
              deep: {
                value: { _state: 'someField' },
              },
            },
          },
        },
      },
    ],
  };
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state is not available in request properties');
});

test('validateServerStateReferences warns once per request with _state in properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'req1',
        payload: {},
        properties: {
          field1: { _state: 'a' },
          field2: { _state: 'b' },
        },
      },
      {
        requestId: 'req2',
        payload: {},
        properties: {
          field1: { _state: 'c' },
        },
      },
    ],
  };
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(2);
  expect(mockLogWarn.mock.calls[0][0]).toContain('request "req1"');
  expect(mockLogWarn.mock.calls[1][0]).toContain('request "req2"');
});

test('validateServerStateReferences handles pages with no requests', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
  };
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateServerStateReferences handles requests with no properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: { userId: { _state: 'selectedUser' } },
      },
    ],
  };
  validateServerStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateServerStateReferences throws in prod mode', () => {
  const context = testContext({ logger });
  context.stage = 'prod';
  const page = {
    pageId: 'page_1',
    requests: [
      {
        requestId: 'getUser',
        payload: {},
        properties: {
          query: { _state: 'userName' },
        },
      },
    ],
  };
  expect(() => validateServerStateReferences({ page, context })).toThrow(
    '_state is not available in request properties'
  );
});
