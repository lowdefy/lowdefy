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

import testSchema from './testSchema.js';
import testContext from '../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const context = testContext({ logger: { warn: mockLogWarn } });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('empty components emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('page auth config emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      pages: {
        protected: true,
        public: ['page1'],
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('valid app schema emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'postman',
        type: 'AxiosHttp',
      },
    ],
    pages: [
      {
        id: 'p1',
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'b1',
            type: 'TextInput',
          },
        ],
        requests: [
          {
            id: 'r1',
            type: 'AxiosHttp',
            connectionId: 'postman',
            properties: {
              url: 'https://postman-echo.com/get',
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('invalid schema emits warning', () => {
  const components = {
    lowdefy: '1.0.0',
    global: 'global',
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "global" should be an object.');
});

test('multiple schema issues emit multiple warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        blocks: [
          {
            id: 'b1',
            type: 'TextInput',
          },
        ],
      },
      {
        id: 1,
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toBe('Block should have required property "id".');
});

test('nested schema warning', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            areas: {
              footer: {
                blocks: [
                  {
                    id: 'button',
                    type: 'Button',
                    events: {
                      onClick: [
                        {
                          id: 'set_state',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Action should have required property "type".');
});

test('nested schema warning for blocks null', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            areas: {
              footer: {
                blocks: [
                  {
                    id: 'box_2',
                    type: 'Box',
                    blocks: null,
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Block "blocks" should be an array.');
});

test('null item in blocks array emits warning', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        blocks: [
          { id: 'valid', type: 'Box' },
          null,
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Block should be an object.');
});

test('custom error messages are not prefixed with property name', () => {
  const components = {
    lowdefy: '1.0.0',
    global: 'global',
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "global" should be an object.');
});

test('default AJV messages are prefixed with property name', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'button_1',
            type: 'Button',
            events: { onClick: 42 },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('"onClick" must be array');
});

test('connections schema warning', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'email-surveys',
        properties: {
          collection: 'email-surveys',
          databaseUri: 'https://example.com',
          write: true,
        },
      },
      {
        type: 'MongoDBCollection',
        properties: {
          collection: 'cati-surveys',
          databaseUri: 'https://example.com',
          write: true,
        },
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Connection should have required property "type".');
});

test('requests schema warning', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        requests: [
          {
            type: 'MongoDBAggregation',
            connectionId: 'interviews',
            properties: {
              pipeline: [],
            },
          },
          {
            id: 'request_1',
            connectionId: 'interviews',
            properties: {
              pipeline: [],
            },
          },
          {
            id: 'request_1',
            type: 'MongoDBAggregation',
            connectionId: 'interviews',
            properties: null,
          },
        ],
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            areas: {
              footer: {
                blocks: [
                  {
                    id: 'box_2',
                    type: 'Box',
                    blocks: [],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Request should have required property "id".');
});

test('menus schema warning', () => {
  const components = {
    lowdefy: '1.0.0',
    menus: [
      {
        id: 'default',
        links: [
          {
            type: 'MenuLink',
            pageId: 'overview',
            properties: {
              title: 'Overview',
            },
          },
          {
            id: 'menu-2',
            properties: {
              title: 'Overview',
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('must NOT have additional properties - "pageId"');
});

test('auth roles catalog of id, label and description objects emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [
        { id: 'admin', label: 'Administrator', description: 'Full access to admin surfaces' },
        { id: 'branch-manager', label: 'Branch Manager' },
        { id: 'auditor' },
      ],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('auth roles as a non-array value emits type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: 'admin',
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Auth "roles" should be an array.');
});

test('auth role entry missing id emits required warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [{ label: 'Administrator' }],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Auth role entries should have required property "id".'
  );
});

test('auth role entry with a non-string id emits type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [{ id: 42 }],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Auth "roles[].id" should be a string.');
});

test('auth role entry with a non-string label emits type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [{ id: 'admin', label: 42 }],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Auth "roles[].label" should be a string.');
});

test('auth role entry with a non-string description emits type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [{ id: 'admin', description: 42 }],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('Auth "roles[].description" should be a string.');
});

test('auth role entry with an unknown key emits additional properties warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      roles: [{ id: 'admin', color: 'red' }],
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Auth role entry has an unknown property. Allowed: "id", "label", "description".'
  );
});

test('connection tenant shared emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'mongo',
        type: 'MongoDBCollection',
        tenant: 'shared',
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('connection tenant true emits warning - the key was removed with the inverted default', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'mongo',
        type: 'MongoDBCollection',
        tenant: true,
      },
    ],
  };
  testSchema({ components, context });
  // The raw const error surfaces here for the same reason as the invalid
  // shape below; buildConnections validateTenant carries the teaching error.
  expect(mockLogWarn).toHaveBeenCalledWith('"tenant" must be equal to constant');
});

test('connection tenant with a field object emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'mongo',
        type: 'MongoDBCollection',
        tenant: { field: 'organization_id' },
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('connection tenant with an invalid shape emits warning', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [
      {
        id: 'mongo',
        type: 'MongoDBCollection',
        tenant: 'organizationId',
      },
    ],
  };
  testSchema({ components, context });
  // The oneOf branch error at the same instance path wins testSchema's
  // same-path dedup, so the raw const error surfaces instead of the custom
  // oneOf errorMessage. The focused buildConnections validateTenant error
  // carries the descriptive message.
  expect(mockLogWarn).toHaveBeenCalledWith('"tenant" must be equal to constant');
});

test('request tenant none emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        requests: [
          {
            id: 'request_1',
            type: 'MongoDBAggregation',
            connectionId: 'mongo',
            tenant: 'none',
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('request tenant with any other value emits warning', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        requests: [
          {
            id: 'request_1',
            type: 'MongoDBAggregation',
            connectionId: 'mongo',
            tenant: true,
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Request "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection; "none" is the explicit request-level opt-out and "authored" declares the request authors its own tenant clause (audited at runtime).'
  );
});

test('request tenant authored emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'page_1',
        type: 'Box',
        requests: [
          {
            id: 'request_1',
            type: 'MongoDBAggregation',
            connectionId: 'mongo',
            tenant: 'authored',
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('websocket tenant none emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    websockets: [
      {
        id: 'ws1',
        type: 'MongoDBChangeStream',
        connectionId: 'mongo',
        tenant: 'none',
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('websocket tenant with any other value emits warning', () => {
  const components = {
    lowdefy: '1.0.0',
    websockets: [
      {
        id: 'ws1',
        type: 'MongoDBChangeStream',
        connectionId: 'mongo',
        tenant: 'off',
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Websocket "tenant" only accepts "none" — the tenant wall is declared on the connection, and "none" is the explicit opt-out at the point of use. ("authored" is aggregation-only; change streams are always scoped mechanically.)'
  );
});

test('valid slug emits no warnings', () => {
  const cases = ['my-app', 'a', 'a-b-c-1', 'app1', 'a1-b2-c3'];
  cases.forEach((slug) => {
    mockLogWarn.mockReset();
    const components = { lowdefy: '1.0.0', slug };
    testSchema({ components, context });
    expect(mockLogWarn).not.toHaveBeenCalled();
  });
});

test('omitted slug emits no warnings', () => {
  const components = { lowdefy: '1.0.0' };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('invalid slug emits kebab-case warning', () => {
  const components = { lowdefy: '1.0.0', slug: 'My-App' };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "slug" must be kebab-case: lowercase letters and digits, hyphen-separated, starting with a letter, no leading/trailing/consecutive hyphens, no underscores.'
  );
});

test('invalid slugs are rejected', () => {
  const invalid = [
    'My-App',
    'my_app',
    '-leading',
    'trailing-',
    'double--hyphen',
    '1starts-with-digit',
    'has space',
    '',
  ];
  invalid.forEach((slug) => {
    mockLogWarn.mockReset();
    const components = { lowdefy: '1.0.0', slug };
    testSchema({ components, context });
    expect(mockLogWarn).toHaveBeenCalled();
  });
});

test('non-string slug emits type warning', () => {
  const components = { lowdefy: '1.0.0', slug: 42 };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "slug" should be a string.');
});

test('description string emits no warnings', () => {
  const components = { lowdefy: '1.0.0', description: 'A useful app.' };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('omitted description emits no warnings', () => {
  const components = { lowdefy: '1.0.0' };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('non-string description emits type warning', () => {
  const components = { lowdefy: '1.0.0', description: 42 };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "description" should be a string.');
});

test('missing lowdefy version schema warning', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'PageHeaderMenu',
        blocks: [
          {
            id: 'box_1',
            type: 'Box',
            areas: {
              footer: {
                blocks: [
                  {
                    id: 'box_2',
                    type: 'Box',
                    blocks: [],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Lowdefy configuration should have required property "lowdefy".'
  );
});

test('page ~snapshotIgnore paths emit no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'controls',
        type: 'PageHeaderMenu',
        '~snapshotIgnore': ['search.results.$.score', 'form.created_at'],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('page ~snapshotIgnore that is not an array of strings emits a warning', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [{ id: 'controls', type: 'PageHeaderMenu', '~snapshotIgnore': 'form.created_at' }],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Block "~snapshotIgnore" should be an array of state path strings.'
  );
});
