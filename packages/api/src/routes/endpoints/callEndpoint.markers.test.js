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
import { serializer } from '@lowdefy/helpers';
import { operatorsServer } from '@lowdefy/operators-js';

import callEndpoint from './callEndpoint.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

test('callEndpoint returns a :return built from config without its build markers', async () => {
  // readConfigFile deserializes the endpoint artifact, so every config object in
  // the routine carries hidden ~k, ~r and ~l markers, as it does on a server.
  const artifact = serializer.deserializeFromString(
    JSON.stringify({
      endpointId: 'order_ep',
      type: 'Api',
      auth: { public: true },
      '~k': 'k1',
      routine: {
        '~arr': [
          {
            ':return': {
              order: {
                id: { _payload: 'id', '~k': 'k5' },
                lines: { '~arr': [{ sku: 'a', '~k': 'k7' }], '~k': 'k6' },
                '~k': 'k4',
                '~r': 'r1',
                '~l': 12,
              },
              '~k': 'k3',
            },
            '~k': 'k2',
          },
        ],
        '~k': 'k8',
      },
    })
  );
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: jest.fn((path) => (path === 'api/order_ep.json' ? artifact : null)),
    user: { id: 'user_1' },
  });
  const result = await callEndpoint(context, {
    blockId: 'blockId',
    endpointId: 'order_ep',
    pageId: 'pageId',
    payload: { id: 'o_1' },
  });
  expect(result.status).toBe('success');
  expect(result.response).toEqual({ order: { id: 'o_1', lines: [{ sku: 'a' }] } });
});
