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

import buildPages from '../buildPages.js';
import testContext from '../../../test/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const auth = {
  public: true,
};

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('set empty operators array if no operators on page', () => {
  const context = testContext({ logger });
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Container',
          },
          {
            id: 'block_2',
            type: 'Container',
            blocks: [
              {
                id: 'block_3',
                type: 'Display',
              },
            ],
          },
          {
            id: 'block_4',
            type: 'Display',
          },
        ],
      },
      {
        id: 'block_5',
        type: 'Display',
        auth,
      },
    ],
  };
  buildPages({ components, context });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({});
  expect(context.typeCounters.operators.server.getCounts()).toEqual({});
});

test('count all operators for the page', () => {
  const context = testContext({ logger });
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        properties: {
          a: { _op_1: {} },
        },
        blocks: [
          {
            id: 'block_1',
            type: 'Display',
            visible: {
              __op_2: {},
            },
            properties: {
              a: { _op_1: {} },
              b: { _op_1: {} },
              c: { _op_3: { __op_4: { ___op_5: {} } } },
            },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({
    _op_1: 3,
    _op_2: 1,
    _op_3: 1,
    _op_4: 1,
    _op_5: 1,
  });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({});
});

test('count requests operators as server operators', () => {
  const context = testContext({ logger });
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
            properties: {
              a: { _r_op_1: {} },
            },
          },
        ],
        properties: {
          a: { _op_1: {} },
        },
        blocks: [
          {
            id: 'block_1',
            type: 'Display',
            visible: {
              _op_2: {},
            },
            properties: {
              a: { _op_3: {} },
            },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({
    _op_1: 1,
    _op_2: 1,
    _op_3: 1,
  });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _r_op_1: 1,
  });
});

test('count request payload operators as client operators', () => {
  const context = testContext({ logger });
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
            payload: {
              a: { _r_op_1: {} },
            },
            properties: {
              a: { _r_op_2: {} },
            },
          },
        ],
        properties: {
          a: { _op_1: {} },
        },
      },
    ],
  };
  buildPages({ components, context });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({
    _r_op_1: 1,
    _op_1: 1,
  });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _r_op_2: 1,
  });
});
