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

import buildPages from '../full/buildPages.js';
import testContext from '../../test-utils/testContext.js';

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
    'Requests is not an array at "page_1" on page "page_1".'
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
    'Request id is not a string at page "page_1".'
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

test('request id contains invalid characters', () => {
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
    'Request id "my.request" at page "page_1" contains invalid characters.'
  );
});

test('request id is a reserved name', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'constructor', type: 'Request' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request id "constructor" at page "page_1" is a reserved name and cannot be used as an id.'
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
    'Request type is not a string at request "request" at page "page_1".'
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
        subscriptions: [],
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
        subscriptions: [],
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
        slots: {
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
        subscriptions: [],
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
        subscriptions: [],
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
        subscriptions: [],
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

test('request connectionId is not a string', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', connectionId: 123 }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" connectionId is not a string.'
  );
});

test('request references non-existent connection', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', connectionId: 'nonExistentConnection' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" references non-existent connection "nonExistentConnection".'
  );
});

test('request tenant none is accepted', () => {
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
            tenant: 'none',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].requests[0].tenant).toBe('none');
});

test('request tenant authored is accepted', () => {
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
            tenant: 'authored',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].requests[0].tenant).toBe('authored');
});

test('request tenant true throws', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', tenant: true }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('request tenant with another string throws', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', tenant: 'off' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('request tenant shared throws naming the connection position', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', tenant: 'shared' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('request tenant with a field object throws naming the connection position', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [{ id: 'my_request', type: 'Request', tenant: { field: 'organization_id' } }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Request "my_request" at page "page_1" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.'
  );
});

test('a literal $search pipeline on a walled connection without tenant authored throws at build', () => {
  const contextWithTenant = testContext({ logger });
  contextWithTenant.connectionIds.add('walled');
  contextWithTenant.tenantConnections.set('walled', {
    type: 'MongoDBCollection',
    field: 'organization_id',
  });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          {
            id: 'my_request',
            type: 'Request',
            connectionId: 'walled',
            properties: { pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }] },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: contextWithTenant })).toThrow(
    'Request "my_request" at page "page_1" contains "$search" in its pipeline on tenant connection "walled", which the tenant wall does not scope mechanically.'
  );
});

test('a literal $graphLookup on a walled connection without tenant authored throws at build', () => {
  const contextWithTenant = testContext({ logger });
  contextWithTenant.connectionIds.add('walled');
  contextWithTenant.tenantConnections.set('walled', {
    type: 'MongoDBCollection',
    field: 'organization_id',
  });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          {
            id: 'my_request',
            type: 'Request',
            connectionId: 'walled',
            properties: {
              pipeline: [{ $match: { a: 1 } }, { $graphLookup: { from: 'walled' } }],
            },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: contextWithTenant })).toThrow(
    'Request "my_request" at page "page_1" contains "$graphLookup" in its pipeline on tenant connection "walled"'
  );
});

test('a $search pipeline with tenant authored passes the build check', () => {
  const contextWithTenant = testContext({ logger });
  contextWithTenant.connectionIds.add('walled');
  contextWithTenant.tenantConnections.set('walled', {
    type: 'MongoDBCollection',
    field: 'organization_id',
  });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          {
            id: 'my_request',
            type: 'Request',
            connectionId: 'walled',
            tenant: 'authored',
            properties: { pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }] },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithTenant });
  expect(res.pages[0].requests[0].tenant).toBe('authored');
});

test('a $search pipeline on an unwalled connection passes the build check', () => {
  const contextWithConn = testContext({ logger });
  contextWithConn.connectionIds.add('open');
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          {
            id: 'my_request',
            type: 'Request',
            connectionId: 'open',
            properties: { pipeline: [{ $search: { text: { query: 'q', path: 'name' } } }] },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithConn });
  expect(res.pages[0].requests[0].id).toBe('request:page_1:my_request');
});

test('an operator-composed pipeline on a walled connection passes the build check silently', () => {
  const contextWithTenant = testContext({ logger });
  contextWithTenant.connectionIds.add('walled');
  contextWithTenant.tenantConnections.set('walled', {
    type: 'MongoDBCollection',
    field: 'organization_id',
  });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        requests: [
          {
            id: 'my_request',
            type: 'Request',
            connectionId: 'walled',
            properties: { pipeline: { '_array.concat': [[], []] } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithTenant });
  expect(res.pages[0].requests[0].id).toBe('request:page_1:my_request');
});

test('request with valid connectionId', () => {
  const contextWithConnection = testContext({ logger });
  contextWithConnection.connectionIds.add('validConnection');
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
            connectionId: 'validConnection',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithConnection });
  expect(res.pages[0].requests[0].connectionId).toBe('validConnection');
});
