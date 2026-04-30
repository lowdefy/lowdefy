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
