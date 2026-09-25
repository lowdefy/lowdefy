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

import { OperatorError, RequestError, UserError } from '@lowdefy/errors';

import {
  maskCredentialKeys,
  projectErrorForLog,
  serializeErrorForLog,
} from './logErrorProjection.js';

const allowedErrorKeys = new Set([
  'name',
  'message',
  'stack',
  'code',
  'statusCode',
  'cause',
  'configKey',
  'source',
  'config',
  'handled',
  'isLowdefyError',
  'received',
  'typeName',
  'location',
  'service',
  'hint',
  'methodName',
  'metaData',
  'blockId',
  'pageId',
  'isReject',
]);

// Every serialized error node carries `stack`; free-form values under
// `received` in these fixtures never do.
function collectErrorNodes(value, nodes = []) {
  if (value === null || typeof value !== 'object') return nodes;
  if (!Array.isArray(value) && Object.hasOwn(value, 'stack')) nodes.push(value);
  Object.values(value).forEach((item) => collectErrorNodes(item, nodes));
  return nodes;
}

function createAxiosError() {
  const error = new Error('Request failed with status code 401');
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
    baseURL: 'https://api.example.com',
  };
  error.request = { path: '/v1/items' };
  error.response = { status: 401, data: { detail: 'planted-response-body' } };
  return error;
}

test('serializeErrorForLog drops axios config, request and response and keeps code and statusCode', () => {
  const serialized = serializeErrorForLog(createAxiosError());
  expect(serialized).toEqual({
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    stack: expect.any(String),
    code: 'ERR_BAD_REQUEST',
    statusCode: 401,
  });
  expect(JSON.stringify(serialized)).not.toMatch(/planted/);
});

test('serializeErrorForLog drops axios fields on the cause of a RequestError', () => {
  const error = new RequestError(undefined, {
    cause: createAxiosError(),
    typeName: 'AxiosHttp',
    configKey: 'key-1',
  });
  const serialized = serializeErrorForLog(error);
  expect(serialized.code).toEqual('ERR_BAD_REQUEST');
  expect(serialized.statusCode).toEqual(401);
  expect(serialized.typeName).toEqual('AxiosHttp');
  expect(serialized.configKey).toEqual('key-1');
  expect(serialized.cause).toEqual({
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    stack: expect.any(String),
    code: 'ERR_BAD_REQUEST',
    statusCode: 401,
  });
  expect(JSON.stringify(serialized)).not.toMatch(/planted/);
});

test('serializeErrorForLog keeps a pg error code and drops detail, schema, table and constraint', () => {
  const error = new Error('duplicate key value violates unique constraint "users_email_key"');
  error.code = '23505';
  error.detail = 'Key (email)=(planted@example.com) already exists.';
  error.schema = 'public';
  error.table = 'users';
  error.constraint = 'users_email_key';
  const serialized = serializeErrorForLog(error);
  expect(serialized).toEqual({
    name: 'Error',
    message: 'duplicate key value violates unique constraint "users_email_key"',
    stack: expect.any(String),
    code: '23505',
  });
});

// Built by hand in Node's shape: a TypeError thrown by `new URL` comes from
// the main realm, which is not `instanceof Error` inside Jest's VM context.
test('serializeErrorForLog drops input from a Node ERR_INVALID_URL error', () => {
  const error = new TypeError('Invalid URL');
  error.code = 'ERR_INVALID_URL';
  error.input = 'https://user:planted@example';
  const serialized = serializeErrorForLog(error);
  expect(serialized.code).toEqual('ERR_INVALID_URL');
  expect(Object.keys(serialized)).not.toContain('input');
});

test('serializeErrorForLog masks credential keys in received and keeps the other received properties', () => {
  const received = {
    url: 'https://api.example.com/items',
    method: 'get',
    headers: { Authorization: 'Bearer runtime-token-1', Accept: 'application/json' },
    params: { access_token: 'runtime-token-2', page: 2 },
    'x-api-key': 'runtime-token-3',
  };
  const error = new RequestError('Upstream failed.', {
    typeName: 'AxiosHttp',
    received,
    cause: new OperatorError('Inner failed.', { typeName: '_step', received }),
  });
  const expectedReceived = {
    url: 'https://api.example.com/items',
    method: 'get',
    headers: { Authorization: '[REDACTED]', Accept: 'application/json' },
    params: { access_token: '[REDACTED]', page: 2 },
    'x-api-key': '[REDACTED]',
  };
  const serialized = serializeErrorForLog(error);
  expect(serialized.received).toEqual(expectedReceived);
  expect(serialized.cause.received).toEqual(expectedReceived);
  expect(JSON.stringify(serialized)).not.toMatch(/runtime-token/);
});

test('serializeErrorForLog does not mutate the received it masks', () => {
  const received = { headers: { Authorization: 'Bearer runtime-token' } };
  serializeErrorForLog(new RequestError('Upstream failed.', { received }));
  expect(received).toEqual({ headers: { Authorization: 'Bearer runtime-token' } });
});

test('serializeErrorForLog projects an Error nested seven levels deep inside a cause property', () => {
  let nested = createAxiosError();
  for (let level = 7; level >= 1; level -= 1) {
    nested = new RequestError(`Level ${level}.`, { received: nested });
  }
  // An explicit received, so the top node does not inherit the cause's.
  const error = new RequestError('Top.', {
    received: { page: 1 },
    cause: new OperatorError('Cause.', { received: nested }),
  });
  const serialized = serializeErrorForLog(error);

  let node = serialized.cause.received;
  for (let level = 1; level <= 7; level += 1) {
    expect(node.message).toEqual(`Level ${level}.`);
    node = node.received;
  }
  expect(node.name).toEqual('AxiosError');
  expect(node.statusCode).toEqual(401);

  const errorNodes = collectErrorNodes(serialized);
  expect(errorNodes).toHaveLength(10);
  errorNodes.forEach((errorNode) => {
    Object.keys(errorNode).forEach((key) => {
      expect(allowedErrorKeys.has(key)).toBe(true);
    });
  });
  expect(JSON.stringify(serialized)).not.toMatch(/planted/);
});

test('serializeErrorForLog keeps UserError metaData, blockId, pageId and isReject', () => {
  const error = new UserError('Please fill in the form.', {
    blockId: 'submit_button',
    pageId: 'orders',
    isReject: true,
    metaData: { step: 'validate' },
  });
  const serialized = serializeErrorForLog(error);
  expect(serialized).toEqual({
    name: 'UserError',
    message: 'Please fill in the form.',
    stack: expect.any(String),
    isLowdefyError: true,
    blockId: 'submit_button',
    pageId: 'orders',
    isReject: true,
    metaData: { step: 'validate' },
  });
});

test('serializeErrorForLog keeps Lowdefy fields on an error that has a Lowdefy class name but not the class', () => {
  const error = new Error('Not allowed.');
  error.name = 'AuthorizationError';
  error.configKey = 'key-2';
  error.isLowdefyError = true;
  error.internalState = 'dropped';
  const serialized = serializeErrorForLog(error);
  expect(serialized).toEqual({
    name: 'AuthorizationError',
    message: 'Not allowed.',
    stack: expect.any(String),
    configKey: 'key-2',
    isLowdefyError: true,
  });
});

test('projectErrorForLog drops Lowdefy field names from a non-Lowdefy error', () => {
  const error = new Error('Library failure.');
  error.received = { password: 'planted' };
  error.source = 'library-internal';
  error.location = 'somewhere';
  const projected = projectErrorForLog(error);
  expect(projected.received).toBeUndefined();
  expect(projected.source).toBeUndefined();
  expect(projected.location).toBeUndefined();
});

test('projectErrorForLog reads statusCode from the node and passes the cause through for the walk', () => {
  const cause = new Error('Inner.');
  const error = new Error('Outer.', { cause });
  error.status = 503;
  const projected = projectErrorForLog(error);
  expect(projected.statusCode).toEqual(503);
  expect(projected.cause).toBe(cause);
});

test('maskCredentialKeys masks keys containing each credential word after lower-casing and removing - and _', () => {
  expect(
    maskCredentialKeys({
      Authorization: 'a',
      access_token: 'b',
      'x-api-key': 'c',
      client_secret: 'd',
      Password: 'e',
      Cookie: 'f',
      API_KEY: 'g',
      tokenCount: 3,
      name: 'kept',
    })
  ).toEqual({
    Authorization: '[REDACTED]',
    access_token: '[REDACTED]',
    'x-api-key': '[REDACTED]',
    client_secret: '[REDACTED]',
    Password: '[REDACTED]',
    Cookie: '[REDACTED]',
    API_KEY: '[REDACTED]',
    tokenCount: '[REDACTED]',
    name: 'kept',
  });
});

test('maskCredentialKeys replaces a whole object value under a credential key', () => {
  expect(maskCredentialKeys({ tokens: { access: 'a', refresh: 'b' } })).toEqual({
    tokens: '[REDACTED]',
  });
});

test('maskCredentialKeys recurses into arrays and nested objects', () => {
  expect(
    maskCredentialKeys({ items: [{ secret: 'a', id: 1 }, [{ cookie: 'b' }], 'plain'] })
  ).toEqual({ items: [{ secret: '[REDACTED]', id: 1 }, [{ cookie: '[REDACTED]' }], 'plain'] });
});

test('maskCredentialKeys returns primitives, Dates, Errors and class instances unchanged', () => {
  class Client {
    constructor() {
      this.password = 'internal';
    }
  }
  const date = new Date(0);
  const error = new Error('x');
  const client = new Client();
  expect(maskCredentialKeys('text')).toEqual('text');
  expect(maskCredentialKeys(undefined)).toBeUndefined();
  expect(maskCredentialKeys(date)).toBe(date);
  expect(maskCredentialKeys(error)).toBe(error);
  expect(maskCredentialKeys(client)).toBe(client);
});

test('serializeErrorForLog marks a class instance in received by type name only', () => {
  class Client {
    constructor() {
      this.password = 'planted';
    }
  }
  const serialized = serializeErrorForLog(
    new RequestError('Failed.', { received: { client: new Client() } })
  );
  expect(serialized.received).toEqual({ client: '[Object: Client]' });
});

test('serializeErrorForLog marks a cycle in received as circular', () => {
  const received = { name: 'loop' };
  received.self = received;
  const serialized = serializeErrorForLog(new RequestError('Failed.', { received }));
  expect(serialized.received).toEqual({ name: 'loop', self: '[Circular]' });
});

test('serializeErrorForLog returns a non-Error value unchanged', () => {
  expect(serializeErrorForLog('plain string')).toEqual('plain string');
  expect(serializeErrorForLog({ message: 'object' })).toEqual({ message: 'object' });
});
