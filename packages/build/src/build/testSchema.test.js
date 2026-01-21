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

import testSchema from './testSchema.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

test('empty components', () => {
  const components = {
    lowdefy: '1.0.0',
  };
  expect(() => testSchema({ components, context })).not.toThrow();
});

test('page auth config', () => {
  const components = {
    lowdefy: '1.0.0',
    auth: {
      pages: {
        protected: true,
        public: ['page1'],
      },
    },
  };
  expect(() => testSchema({ components, context })).not.toThrow();
});

test('app schema', () => {
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
  expect(() => testSchema({ components, context })).not.toThrow();
});

test('invalid schema', () => {
  const components = {
    lowdefy: '1.0.0',
    global: 'global',
  };
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] App "global" should be an object.'
  );
});

test('multiple schema errors throws on first error', () => {
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
  // Without context.errors array, throws on first error
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Block should have required property "id".'
  );
});

test('nested schema error', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Action should have required property "type".'
  );
});

test('nested schema error 2', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Block "blocks" should be an array.'
  );
});

test('connections schema error', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Connection should have required property "type".'
  );
});

test('requests schema error', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Request should have required property "id".'
  );
});

test('menus schema error', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] must NOT have additional properties - "pageId"'
  );
});

test('missing lowdefy version schema error', () => {
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
  expect(() => testSchema({ components, context })).toThrow(
    '[Config Error] Lowdefy configuration should have required property "lowdefy".'
  );
});
