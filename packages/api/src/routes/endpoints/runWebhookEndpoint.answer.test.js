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

const validateName = {
  id: 'validate:hook:check_body',
  stepId: 'check_body',
  type: 'ValidateSchema',
  properties: {
    schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
    data: { _payload: 'body' },
  },
};

function callWorker(stepId = 'call_worker') {
  return {
    id: `endpoint:hook:${stepId}`,
    stepId,
    type: 'CallApi',
    properties: { endpointId: 'worker', payload: { id: { _payload: 'body.id' } } },
  };
}

async function runHook({ routine, worker, rawBody = '{}' }) {
  const endpoints = {
    hook: { endpointId: 'hook', type: 'Api', webhook: true, routine },
    worker: { endpointId: 'worker', type: 'InternalApi', auth: { public: true }, ...worker },
  };
  const context = testContext({
    logger,
    operators: operatorsServer,
    readConfigFile: jest.fn((path) => endpoints[path.slice(4, -5)] ?? null),
  });
  return runWebhookEndpoint(context, { endpointId: 'hook', rawBody, query: {}, headers: {} });
}

test('a successful webhook routine answers 200 with its return value', async () => {
  const result = await runHook({ routine: { ':return': { received: true } } });
  expect(result).toEqual({ status: 200, body: { received: true } });
});

test('a webhook routine that returns nothing answers 200 with { ok: true }', async () => {
  const result = await runHook({ routine: [{ ':log': 'done' }] });
  expect(result).toEqual({ status: 200, body: { ok: true } });
});

test('a :reject with :status and :body answers that status with the body as is', async () => {
  const result = await runHook({
    routine: {
      ':reject': 'Ticket not found.',
      ':status': 404,
      ':body': { error: 'not_found', ticket: { _payload: 'body.id' }, at: { _date: 0 } },
    },
    rawBody: '{"id":"t-1"}',
  });
  expect(result.status).toBe(404);
  expect(JSON.stringify(result.body)).toBe(
    '{"error":"not_found","ticket":"t-1","at":"1970-01-01T00:00:00.000Z"}'
  );
});

test('a :reject with :status from an operator answers that status with an error body', async () => {
  const result = await runHook({
    routine: { ':reject': 'Slow down.', ':status': { _sum: [400, 29] } },
  });
  expect(result).toEqual({
    status: 429,
    body: { error: { code: 'rejected', message: 'Slow down.' } },
  });
});

test('a :reject without :status answers 400 with the reject message', async () => {
  const result = await runHook({ routine: { ':reject': 'Missing ticket id.' } });
  expect(result).toEqual({
    status: 400,
    body: { error: { code: 'rejected', message: 'Missing ticket id.' } },
  });
});

test('a :reject with :body and no :status answers 400 with the body', async () => {
  const result = await runHook({ routine: { ':reject': 'No.', ':body': { reason: 'closed' } } });
  expect(result).toEqual({ status: 400, body: { reason: 'closed' } });
});

test('a :reject whose :status evaluates outside 400 to 499 answers 500 and logs a config error', async () => {
  const result = await runHook({ routine: { ':reject': 'No.', ':status': { _sum: [500, 3] } } });
  expect(result).toEqual({
    status: 500,
    body: { error: { code: 'internal_error', message: 'Webhook failed.' } },
  });
  expect(logger.error.mock.calls[0][0].message).toBe(
    ':status in :reject must be an integer from 400 to 499.'
  );
});

test('a :reject with :status 404 in an endpoint the routine calls sets the webhook answer', async () => {
  const result = await runHook({
    routine: [callWorker(), { ':return': { reached: true } }],
    worker: {
      routine: {
        ':reject': 'Ticket not found.',
        ':status': 404,
        ':body': { error: 'not_found', id: { _payload: 'id' } },
      },
    },
    rawBody: '{"id":"t-9"}',
  });
  expect(result).toEqual({ status: 404, body: { error: 'not_found', id: 't-9' } });
});

test('a :reject in a called endpoint is not caught by a :try around the call', async () => {
  const result = await runHook({
    routine: {
      ':try': [callWorker(), { ':return': { reached: true } }],
      ':catch': [{ ':return': { caught: true } }],
    },
    worker: { routine: { ':reject': 'Too large.', ':status': 413 } },
  });
  expect(result).toEqual({
    status: 413,
    body: { error: { code: 'rejected', message: 'Too large.' } },
  });
});

test('a failed ValidateSchema step answers 400 naming the failing path', async () => {
  const result = await runHook({ routine: [validateName, { ':return': { ok: 1 } }] });
  expect(result).toEqual({
    status: 400,
    body: {
      error: {
        code: 'invalid_request',
        message:
          'ValidateSchema step "check_body" failed at (root): must have required property \'name\'.',
      },
    },
  });
});

test('a failed ValidateSchema step in a called endpoint answers 400', async () => {
  const result = await runHook({
    routine: [callWorker()],
    worker: {
      routine: [
        {
          ...validateName,
          id: 'validate:worker:check_body',
          properties: { ...validateName.properties, data: { name: 3 } },
        },
      ],
    },
  });
  expect(result.status).toBe(400);
  expect(result.body.error.code).toBe('invalid_request');
  expect(result.body.error.message).toBe(
    'ValidateSchema step "check_body" failed at /name: must be string.'
  );
});

test('a caught failure does not change the answer', async () => {
  const result = await runHook({
    routine: {
      ':try': [validateName],
      ':catch': [{ ':return': { accepted: false } }],
    },
  });
  expect(result).toEqual({ status: 200, body: { accepted: false } });
});

test('a :throw answers 500 with nothing from the error', async () => {
  const result = await runHook({ routine: { ':throw': 'Database password is hunter2.' } });
  expect(result).toEqual({
    status: 500,
    body: { error: { code: 'internal_error', message: 'Webhook failed.' } },
  });
});

test('a failed verify gate answers 401', async () => {
  const endpoints = {
    hook: {
      endpointId: 'hook',
      type: 'Api',
      webhook: { verify: { connectionId: 'verifier', type: 'Verify', properties: {} } },
      routine: { ':return': { received: true } },
    },
  };
  const context = testContext({
    logger,
    connections: {
      VerifyConnection: {
        schema: true,
        requests: { Verify: Object.assign(() => false, { schema: true, meta: {} }) },
      },
    },
    operators: operatorsServer,
    readConfigFile: jest.fn((path) => {
      if (path === 'connections/verifier.json') {
        return { id: 'connection:verifier', connectionId: 'verifier', type: 'VerifyConnection' };
      }
      return endpoints[path.slice(4, -5)] ?? null;
    }),
  });
  const result = await runWebhookEndpoint(context, {
    endpointId: 'hook',
    rawBody: '{}',
    query: {},
    headers: {},
  });
  expect(result).toEqual({
    status: 401,
    body: { error: { code: 'unauthorized', message: 'Webhook verification failed.' } },
  });
});
