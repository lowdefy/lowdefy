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
  expect(mockLogWarn.mock.calls[0][0]).toBe('Page should have required property "id".');
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
        blocks: [{ id: 'valid', type: 'Box' }, null],
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
  expect(mockLogWarn).toHaveBeenCalledWith('Auth role entries should have required property "id".');
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
  // B-43: the oneOf errorMessage is the only message that lists the legal
  // forms, so it wins the path over the first branch's raw const error.
  expect(mockLogWarn.mock.calls[0][0]).toContain(
    'Connection "tenant" should be "shared" or a top-level tenant field name'
  );
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

test('connection tenant accepts a bare tenant field name', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [{ id: 'mongo', type: 'MongoDBCollection', tenant: 'organizationId' }],
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
        tenant: { organizationId: true },
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls[0][0]).toContain(
    'Connection "tenant" should be "shared" or a top-level tenant field name'
  );
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

// --- page definition: page-only keys are not advertised on nested blocks ---

test('a page may declare state, subscriptions and ~snapshotIgnore', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'home',
        type: 'Box',
        state: { 'a.b': { type: 'string' } },
        subscriptions: [],
        '~snapshotIgnore': ['a.b'],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('a nested block declaring a page-only state key is an unknown property', () => {
  const components = {
    lowdefy: '1.0.0',
    pages: [
      {
        id: 'home',
        type: 'Box',
        blocks: [{ id: 'b1', type: 'Box', state: { 'a.b': { type: 'string' } } }],
      },
    ],
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls[0][0]).toContain('"state"');
});

// --- B-43: a oneOf error is kept when it is the only error at its path ---

test('collectionField oneOf errorMessage survives when it is the only error at its path', () => {
  const components = {
    lowdefy: '1.0.0',
    collections: {
      answers: { fields: { title: 12 } },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls[0][0]).toContain('Collection field should be a type name');
});

test('collectionField object branch rejects an empty field declaration', () => {
  const components = {
    lowdefy: '1.0.0',
    collections: {
      answers: { fields: { title: {} } },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('Collection field should be a type name');
});

test('connection tenant oneOf errorMessage wins the path over a branch error', () => {
  const components = {
    lowdefy: '1.0.0',
    connections: [{ id: 'c1', type: 'MongoDBCollection', tenant: 12 }],
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls[0][0]).toContain(
    'Connection "tenant" should be "shared" or a top-level tenant field name'
  );
});

test('an errorMessage that did not replace a branch keyword does not win the path', () => {
  // A menu link missing "id" also carries an unknown-property error; the
  // unknown property is the more useful message and must still surface.
  const components = {
    lowdefy: '1.0.0',
    menus: [{ id: 'default', links: [{ type: 'MenuLink', pageId: 'overview', properties: {} }] }],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('must NOT have additional properties - "pageId"');
});

// --- auth.dev.users entries are typed (review B, task 15) ---

test('auth.dev.users entry with "role" instead of "roles" is a located warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: { dev: { users: { admin: { role: 'admin' } } } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('unknown property');
});

test('auth.dev.users entry with a string roles value is a warning', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: { dev: { users: { admin: { roles: 'admin' } } } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('roles');
});

test('a fully declared auth.dev.users entry emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      dev: {
        users: {
          admin: {
            id: 'u1',
            name: 'Admin',
            email: 'admin@example.com',
            roles: ['admin'],
            organizationId: 'org1',
            organization_id: 'org1',
            attributes: {},
            profile: {},
          },
        },
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

// --- component prop definitions are typed (review G §5) ---

test('a typo in a component prop definition key is a warning', () => {
  const components = {
    lowdefy: '1.0.0',
    components: [{ id: 'Card', props: { title: { typ: 'string' } } }],
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('unknown key');
});

// --- logger.events (wide events, review H P1.1) ---

test('logger events string form emits no warnings', () => {
  const components = { lowdefy: '1.0.0', logger: { events: 'all' } };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('logger events object form emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    logger: { events: { level: 'errors', sample_rate: 0.05, identity: true } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('an unknown logger events level is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { events: 'everything' } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.events');
});

test('a logger events sample_rate above 1 is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { events: { sample_rate: 2 } } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.events');
});

// --- logger.journeys (recorded journeys, review H P2.1 / R17) ---

test('logger journeys with enabled and sample_rate emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    logger: { journeys: { enabled: false, sample_rate: 0.5 } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('a logger journeys sample_rate above 1 is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { journeys: { sample_rate: 2 } } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.journeys');
});

test('an unknown logger journeys key is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { journeys: { rate: 1 } } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.journeys');
});

// --- logger.otlp (OTLP export, review H P1.2 / R16) ---

test('logger otlp with an endpoint, secret headers, resource and batch emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    logger: {
      otlp: {
        endpoint: 'https://api.axiom.co/v1/logs',
        headers: {
          Authorization: { _secret: 'AXIOM_TOKEN' },
          'X-Axiom-Dataset': 'lowdefy',
        },
        resource: { 'deployment.environment': 'production' },
        batch: { size: 100, flush_ms: 500 },
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('logger otlp without an endpoint is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { otlp: { headers: {} } } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.otlp');
});

test('a logger otlp endpoint that is not a url is a warning', () => {
  const components = { lowdefy: '1.0.0', logger: { otlp: { endpoint: 'not a url' } } };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('logger.otlp.endpoint');
});

test('an unknown logger otlp property is a warning', () => {
  const components = {
    lowdefy: '1.0.0',
    logger: { otlp: { endpoint: 'https://api.axiom.co/v1/logs', batch: { sise: 10 } } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalled();
  expect(mockLogWarn.mock.calls[0][0]).toContain('"sise"');
});

test('theme mode, density and radius emit no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: {
      mode: 'dark',
      density: 'compact',
      radius: 12,
      antd: { token: { colorPrimary: '#6366f1' } },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('theme mode with an unknown value emits an enum warning', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: { mode: 'darkish' },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "theme.mode" should be one of "system", "light" or "dark".'
  );
});

test('theme density with an unknown value emits an enum warning', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: { density: 'cosy' },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "theme.density" should be one of "default" or "compact".'
  );
});

test('theme radius as a string emits a type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: { radius: '12' },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "theme.radius" should be a number.');
});

test('theme radius below zero emits a minimum warning', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: { radius: -1 },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "theme.radius" should be greater than or equal to 0.'
  );
});

test('theme with an unknown property emits an additional properties warning', () => {
  const components = {
    lowdefy: '1.0.0',
    theme: { modes: 'dark' },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "theme" contains an unknown property. The known properties are "mode", "density", "radius", "antd", "tailwind" and "darkMode".'
  );
});

test('config feedback with enabled and roles emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { feedback: { enabled: true, roles: ['support', 'admin'] } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('config feedback enabled as a string emits a type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { feedback: { enabled: 'yes' } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "config.feedback.enabled" should be a boolean.');
});

test('config feedback roles as a string emits a type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { feedback: { roles: 'support' } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "config.feedback.roles" should be an array of strings.'
  );
});

test('an unknown config feedback property emits an additional properties warning', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { feedback: { screenshots: true } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "config.feedback" contains an unknown property. The known properties are "enabled" and "roles".'
  );
});

test('config ops enabled false emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { ops: { enabled: false } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('config ops enabled as a string emits a type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { ops: { enabled: 'no' } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith('App "config.ops.enabled" should be a boolean.');
});

test('an unknown config ops property emits an additional properties warning', () => {
  const components = {
    lowdefy: '1.0.0',
    config: { ops: { dataset: 'prod' } },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'App "config.ops" contains an unknown property. The known properties are "enabled".'
  );
});

test('a _slot marker in a component body block list emits no warnings', () => {
  const components = {
    lowdefy: '1.0.0',
    components: {
      AnswerPill: {
        id: 'AnswerPill',
        slots: ['footer'],
        blocks: [
          {
            id: 'root',
            type: 'Box',
            blocks: [{ _slot: 'footer' }],
            slots: { extra: { blocks: [{ _slot: 'footer' }] } },
          },
        ],
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('a _slot marker with additional keys emits an additional properties warning', () => {
  const components = {
    lowdefy: '1.0.0',
    components: {
      AnswerPill: {
        id: 'AnswerPill',
        slots: ['footer'],
        blocks: [{ id: 'root', type: 'Box', blocks: [{ _slot: 'footer', type: 'Box' }] }],
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'A "_slot" marker may only contain "_slot". Write the slot name as the only key of the list element.'
  );
});

test('a _slot marker that is not a string emits a type warning', () => {
  const components = {
    lowdefy: '1.0.0',
    components: {
      AnswerPill: {
        id: 'AnswerPill',
        slots: ['footer'],
        blocks: [{ id: 'root', type: 'Box', blocks: [{ _slot: 3 }] }],
      },
    },
  };
  testSchema({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'A "_slot" marker should name one of the component\'s declared slots as a string.'
  );
});
