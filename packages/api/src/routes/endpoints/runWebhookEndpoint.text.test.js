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
import { operatorsServer } from '@lowdefy/operators-js';

import runWebhookEndpoint from './runWebhookEndpoint.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

async function runHook({ routine, query = {} }) {
  const endpoints = { hook: { endpointId: 'hook', type: 'Api', webhook: true, routine } };
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: jest.fn((path) => endpoints[path.slice(4, -5)] ?? null),
  });
  return runWebhookEndpoint(context, { endpointId: 'hook', rawBody: '', query, headers: {} });
}

// A subscription handshake: the sender posts ?validationToken=<token> and wants the token back as
// the plain-text body of a 200.
const handshake = [
  {
    ':if': { _ne: [{ _payload: 'query.validationToken' }, null] },
    ':then': {
      ':return': { _payload: 'query.validationToken' },
      ':content_type': 'text/plain',
    },
  },
  { ':return': { received: true } },
];

test('a :return with :content_type text/plain answers 200 with the string as text', async () => {
  const result = await runHook({
    routine: handshake,
    query: { validationToken: 'Validation: Testing client application' },
  });
  expect(result).toEqual({
    status: 200,
    body: 'Validation: Testing client application',
    contentType: 'text/plain',
  });
});

test('a :return without :content_type still answers 200 with JSON', async () => {
  const result = await runHook({ routine: handshake });
  expect(result).toEqual({ status: 200, body: { received: true } });
});

test('a :return without :content_type answers a string as JSON, as before', async () => {
  const result = await runHook({ routine: { ':return': 'token' } });
  expect(result).toEqual({ status: 200, body: 'token' });
});

test('a :return with :content_type text/plain that is not a string answers 500', async () => {
  const result = await runHook({
    routine: { ':return': { _payload: 'query.validationToken' }, ':content_type': 'text/plain' },
  });
  expect(result).toEqual({
    status: 500,
    body: { error: { code: 'internal_error', message: 'Webhook failed.' } },
  });
});
