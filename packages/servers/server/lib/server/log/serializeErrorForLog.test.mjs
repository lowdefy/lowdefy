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

import projectErrorForLog from './projectErrorForLog.js';
import serializeErrorForLog from './serializeErrorForLog.js';

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
  'typeName',
  'location',
  'service',
  'hint',
  'methodName',
  'metaData',
  'blockId',
  'pageId',
  'isReject',
  'endpointId',
  'stepId',
  'connectionId',
]);

// Every serialized error node carries `stack`.
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

test('serializeErrorForLog leaves out the evaluated input an operator error carries as received', () => {
  const received = { idNumber: '8001015009087' };
  const error = new OperatorError('_string.concat failed.', {
    typeName: '_string.concat',
    received,
    cause: new OperatorError('Inner failed.', { typeName: '_get', received }),
  });
  const serialized = serializeErrorForLog(error);
  expect(serialized.typeName).toEqual('_string.concat');
  expect(serialized.received).toBeUndefined();
  expect(serialized.cause.received).toBeUndefined();
  expect(JSON.stringify(serialized)).not.toMatch(/8001015009087/);
});

// metaData is the one kept free-form field, so an error placed in it is walked like any other value.
test('serializeErrorForLog projects an Error nested seven levels deep inside a kept field', () => {
  let nested = createAxiosError();
  for (let level = 7; level >= 1; level -= 1) {
    const wrapper = new RequestError(`Level ${level}.`);
    wrapper.metaData = nested;
    nested = wrapper;
  }
  const error = new RequestError('Top.', { cause: new OperatorError('Cause.') });
  error.cause.metaData = nested;
  const serialized = serializeErrorForLog(error);

  let node = serialized.cause.metaData;
  for (let level = 1; level <= 7; level += 1) {
    expect(node.message).toEqual(`Level ${level}.`);
    node = node.metaData;
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

test("serializeErrorForLog keeps a failed request's ids and leaves out the connection's error it keeps for the dev tools", () => {
  const driverError = new Error('Document failed validation');
  driverError.name = 'MongoServerError';
  driverError.errInfo = { details: { document: { message: 'planted-chat-text' } } };
  const error = new RequestError('Document failed validation', {
    cause: new Error('Document failed validation'),
    typeName: 'MongoDBInsertOne',
    location: 'threads/save_thread',
  });
  Object.assign(error, {
    endpointId: 'save-thread',
    stepId: 'save_thread',
    connectionId: 'threads',
  });
  Object.defineProperty(error, 'devCause', { value: driverError });

  const serialized = serializeErrorForLog(error);

  expect(serialized).toMatchObject({
    name: 'RequestError',
    endpointId: 'save-thread',
    stepId: 'save_thread',
    connectionId: 'threads',
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

test('serializeErrorForLog returns a non-Error value unchanged', () => {
  expect(serializeErrorForLog('plain string')).toEqual('plain string');
  expect(serializeErrorForLog({ message: 'object' })).toEqual({ message: 'object' });
});
