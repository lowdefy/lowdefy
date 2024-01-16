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

import buildPages from './buildPages.js';
import testContext from '../../test/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const auth = {
  public: true,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('requests not an array', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: 'requests',
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Requests is not an array at "page_1" on page "page_1". Received "requests"'
  );
});

test('request id missing', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ type: 'Request' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow('Request id missing at page "page_1".');
});

test('request id not a string', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: true, type: 'Request' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request id is not a string at page "page_1". Received true.'
  );
});

test('Throw on duplicate request ids', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          { id: 'request_1', type: 'Request' },
          { id: 'request_1', type: 'Request' },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Duplicate requestId "request_1" on page "page_1".'
  );
});

test('Throw on duplicate request ids', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'request_1', type: 'Request' }],
        blocks: [
          {
            id: 'one',
            type: 'Container',
            blocks: [
              {
                id: 'two',
                type: 'Input',
                requests: [{ id: 'request_1', type: 'Request' }],
              },
            ],
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Duplicate requestId "request_1" on page "page_1".'
  );
});

test('request id contains a "."', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my.request', type: 'Request' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request id "my.request" at page "page_1" should not include a period (".").'
  );
});

test('request type is not a string', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'request' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request type is not a string at at request at "request" at page "page_1". Received undefined.'
  );
});

test('request payload not an object', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', payload: 'payload' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" payload should be an object.'
  );
});

test('give request an id', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        requests: [
          {
            id: 'request_1',
            type: 'Request',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        requests: [
          {
            id: 'request:page_1:request_1',
            type: 'Request',
            auth: { public: true },
            requestId: 'request_1',
            pageId: 'page_1',
            payload: {},
          },
        ],
      },
    ],
  });
});

test('request on a sub-block', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'box',
            type: 'Container',
            requests: [
              {
                id: 'request_1',
                type: 'Request',
              },
            ],
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        blockId: 'page_1',
        pageId: 'page_1',
        type: 'Container',
        requests: [
          {
            id: 'request:page_1:request_1',
            type: 'Request',
            auth: { public: true },
            requestId: 'request_1',
            pageId: 'page_1',
            payload: {},
          },
        ],
        areas: {
          content: {
            blocks: [
              {
                id: 'block:page_1:box:0',
                blockId: 'box',
                type: 'Container',
              },
            ],
          },
        },
      },
    ],
  });
});

test('multiple requests', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        requests: [
          {
            id: 'request_1',
            type: 'Request',
          },
          {
            id: 'request_2',
            type: 'Request',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        requests: [
          {
            id: 'request:page_1:request_1',
            type: 'Request',
            auth: { public: true },
            requestId: 'request_1',
            pageId: 'page_1',
            payload: {},
          },
          {
            id: 'request:page_1:request_2',
            type: 'Request',
            auth: { public: true },
            requestId: 'request_2',
            pageId: 'page_1',
            payload: {},
          },
        ],
      },
    ],
  });
});

test('set auth to request', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth: { public: true },
        type: 'Container',
        requests: [
          {
            id: 'request_1',
            type: 'Request',
          },
        ],
      },
      {
        id: 'page_2',
        type: 'Container',
        auth: { public: false },
        requests: [
          {
            id: 'request_2',
            type: 'Request',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page:page_1',
        auth: { public: true },
        pageId: 'page_1',
        blockId: 'page_1',
        type: 'Container',
        requests: [
          {
            id: 'request:page_1:request_1',
            type: 'Request',
            auth: { public: true },
            requestId: 'request_1',
            pageId: 'page_1',
            payload: {},
          },
        ],
      },
      {
        id: 'page:page_2',
        auth: { public: false },
        pageId: 'page_2',
        blockId: 'page_2',
        type: 'Container',
        requests: [
          {
            id: 'request:page_2:request_2',
            type: 'Request',
            auth: { public: false },
            requestId: 'request_2',
            pageId: 'page_2',
            payload: {},
          },
        ],
      },
    ],
  });
});
