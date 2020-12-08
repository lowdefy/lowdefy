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

import testSchema from './testSchema';
import testContext from '../test/testContext';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('empty components', async () => {
  const components = {};
  await testSchema({ components, context });
  expect().toBe();
});

test('app schema', async () => {
  const components = {
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
  expect().toBe();
});

test('invalid schema', async () => {
  const components = {
    global: 'global',
  };
  await testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `--------- Schema Error ---------
message: should be object
path: /global
--------------------------------`,
    ],
  ]);
});

test('multiple schema errors', async () => {
  const components = {
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
  await testSchema({ components, context });
  expect(mockLogWarn.mock.calls).toEqual([
    ['Schema not valid.'],
    [
      `--------- Schema Error ---------
message: should have required property 'id'
path: /pages/0
--------------------------------`,
    ],
    [
      `--------- Schema Error ---------
message: should have required property 'type'
path: /pages/0
--------------------------------`,
    ],
    [
      `--------- Schema Error ---------
message: should be string
path: /pages/1/id
--------------------------------`,
    ],
    [
      `--------- Schema Error ---------
message: should have required property 'type'
path: /pages/1
--------------------------------`,
    ],
  ]);
});
