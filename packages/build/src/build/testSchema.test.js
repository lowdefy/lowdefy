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

import testSchema from './testSchema.js';
import testContext from '../test/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('empty components', () => {
  const components = {
    lowdefy: '1.0.0',
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([]);
});

test('invalid schema', () => {
  const components = {
    lowdefy: '1.0.0',
    global: 'global',
  };
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
App "global" should be an object.
- global`,
    ],
  ]);
});

test('multiple schema errors', () => {
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
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Block should have required property "id".
- pages
 - [0]`,
    ],
    [
      `Schema Error
Block should have required property "type".
- pages
 - [0]`,
    ],
    [
      `Schema Error
Block "id" should be a string.
- pages
 - [1:1:_ERROR_MISSING_TYPE_].id`,
    ],
    [
      `Schema Error
Block should have required property "type".
- pages
 - [1:1:_ERROR_MISSING_TYPE_]`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Action should have required property "type".
- pages
 - [0:page_1:PageHeaderMenu].blocks
  - [0:box_1:Box].areas.footer.blocks
   - [0:button:Button].events.onClick
    - [0:set_state:_ERROR_MISSING_TYPE_]`,
    ],
    [
      `Schema Error
must be object
- pages
 - [0:page_1:PageHeaderMenu].blocks
  - [0:box_1:Box].areas.footer.blocks
   - [0:button:Button].events.onClick`,
    ],
    [
      `Schema Error
must match a schema in anyOf
- pages
 - [0:page_1:PageHeaderMenu].blocks
  - [0:box_1:Box].areas.footer.blocks
   - [0:button:Button].events.onClick`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Block "blocks" should be an array.
- pages
 - [0:page_1:PageHeaderMenu].blocks
  - [0:box_1:Box].areas.footer.blocks
   - [0:box_2:Box].blocks`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Connection should have required property "type".
- connections
 - [0:email-surveys:_ERROR_MISSING_TYPE_]`,
    ],
    [
      `Schema Error
Connection should have required property "id".
- connections
 - [1:_ERROR_MISSING_ID_:MongoDBCollection]`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Request should have required property "id".
- pages
 - [0:page_1:PageHeaderMenu].requests
  - [0:_ERROR_MISSING_ID_:MongoDBAggregation]`,
    ],
    [
      `Schema Error
Request should have required property "type".
- pages
 - [0:page_1:PageHeaderMenu].requests
  - [1:request_1:_ERROR_MISSING_TYPE_]`,
    ],
    [
      `Schema Error
Request "properties" should be an object.
- pages
 - [0:page_1:PageHeaderMenu].requests
  - [2:request_1:MongoDBAggregation].properties`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
must NOT have additional properties
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [0:_ERROR_MISSING_ID_:MenuLink]`,
    ],
    [
      `Schema Error
MenuGroup should have required property "id".
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [0:_ERROR_MISSING_ID_:MenuLink]`,
    ],
    [
      `Schema Error
MenuLink should have required property "id".
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [0:_ERROR_MISSING_ID_:MenuLink]`,
    ],
    [
      `Schema Error
must match a schema in anyOf
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [0:_ERROR_MISSING_ID_:MenuLink]`,
    ],
    [
      `Schema Error
MenuGroup should have required property "type".
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [1:menu-2:_ERROR_MISSING_TYPE_]`,
    ],
    [
      `Schema Error
MenuLink should have required property "type".
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [1:menu-2:_ERROR_MISSING_TYPE_]`,
    ],
    [
      `Schema Error
must match a schema in anyOf
- menus
 - [0:default:_ERROR_MISSING_TYPE_].links
  - [1:menu-2:_ERROR_MISSING_TYPE_]`,
    ],
  ]);
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
  testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `Schema Error
Lowdefy configuration should have required property "lowdefy".
`,
    ],
  ]);
});
