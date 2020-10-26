/*
  Copyright 2020 Lowdefy, Inc

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

import testAppSchema from './testAppSchema';

test('empty app', async () => {
  const app = {};
  const res = testAppSchema(app);
  expect(res).toEqual({
    valid: true,
  });
});

test('app schema', async () => {
  const app = {
    connections: [
      {
        id: 'postman',
        type: 'AxiosHttp',
      },
    ],
    global: {
      key: 'value',
    },
    menus: [
      {
        id: 'default',
        links: [
          {
            id: 'm1',
            type: 'MenuLink',
            pageId: 'p1',
            properties: {
              title: 'title',
            },
          },
        ],
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
  const res = testAppSchema(app);
  expect(res).toEqual({
    valid: true,
  });
});

test('invalid schema', async () => {
  const app = {
    global: 'global',
  };
  const res = testAppSchema(app);
  expect(res).toEqual({
    valid: false,
    errors: [
      {
        dataPath: '.global',
        keyword: 'type',
        message: 'should be object',
        params: {
          type: 'object',
        },
        schemaPath: '#/properties/global/type',
      },
    ],
  });
});

test('multiple schema errors', async () => {
  const app = {
    global: 'global',
    menus: 'menus',
  };
  const res = testAppSchema(app);
  expect(res).toEqual({
    valid: false,
    errors: [
      {
        dataPath: '.global',
        keyword: 'type',
        message: 'should be object',
        params: {
          type: 'object',
        },
        schemaPath: '#/properties/global/type',
      },
      {
        dataPath: '.menus',
        keyword: 'type',
        message: 'should be array',
        params: {
          type: 'array',
        },
        schemaPath: '#/properties/menus/type',
      },
    ],
  });
});
