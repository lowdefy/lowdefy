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

import {
  AuthenticationError,
  ConfigError,
  LowdefyInternalError,
  RequestError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import createWireProjection from './createWireProjection.js';

const context = { rid: 'rid-1' };

function serialize(value, ctx = context) {
  return serializer.serialize(value, { projectError: createWireProjection(ctx) });
}

// A plain Error from a third-party library: a message naming internals, an own
// config object holding credentials, and the evaluated input.
function createForeignError() {
  const error = new Error('connect to postgres://admin:hunter2@db.internal:5432 failed');
  error.config = { auth: { username: 'admin', password: 'hunter2' } };
  error.received = { query: 'SELECT * FROM users' };
  error.hostname = 'db.internal';
  return error;
}

const genericForeignNode = {
  name: 'Error',
  message: 'Something went wrong.',
  requestId: 'rid-1',
  isLowdefyError: true,
};

function expectNoInternals(payload) {
  const text = JSON.stringify(payload);
  expect(text).not.toContain('hunter2');
  expect(text).not.toContain('db.internal');
  expect(text).not.toContain('SELECT');
}

test('createWireProjection gives a foreign error at depth 0 the generic shape and nothing else', () => {
  const payload = serialize(createForeignError());

  expect(payload).toEqual({ '~e': genericForeignNode });
  expectNoInternals(payload);
});

test('createWireProjection drops the foreign cause of a RequestError with the rest of the chain', () => {
  const error = new RequestError('Request failed.', {
    cause: createForeignError(),
    configKey: 'key-1',
    received: { headers: { authorization: 'Bearer hunter2' } },
  });
  error.source = 'requests/users.yaml:4';
  error.config = 'root.pages[0:home].requests[0:users]';

  const payload = serialize(error);

  expect(payload).toEqual({
    '~e': {
      name: 'RequestError',
      message: 'Something went wrong.',
      configKey: 'key-1',
      requestId: 'rid-1',
      isLowdefyError: true,
    },
  });
  expectNoInternals(payload);
});

test('createWireProjection drops an Error-valued own property of a generic node', () => {
  const error = new ConfigError('Outer failed.');
  error.innerError = createForeignError();

  const payload = serialize(error);

  expect(Object.keys(payload['~e'])).toEqual(['name', 'message', 'requestId', 'isLowdefyError']);
  expectNoInternals(payload);
});

test('createWireProjection gives a foreign Error held in UserError metaData the generic shape', () => {
  const error = new UserError('Order rejected.', { metaData: { upstream: createForeignError() } });

  const payload = serialize(error);

  expect(payload['~e'].metaData).toEqual({ upstream: genericForeignNode });
  expectNoInternals(payload);
});

test('createWireProjection gives a foreign error nested in a response value the generic shape', () => {
  const payload = serialize({ steps: { attempt: { error: createForeignError() } } });

  expect(payload).toEqual({ steps: { attempt: { error: { '~e': genericForeignNode } } } });
  expectNoInternals(payload);
});

test('createWireProjection keeps a Lowdefy class name and sends Error for any other class', () => {
  const serviceError = new ServiceError(undefined, {
    cause: Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:27017'), {
      code: 'ECONNREFUSED',
    }),
    service: 'MongoDB',
  });

  expect(serialize(serviceError)['~e'].name).toBe('ServiceError');
  expect(serialize(serviceError)['~e'].code).toBe('ECONNREFUSED');
  expect(serialize(serviceError)['~e'].service).toBeUndefined();
  expect(serialize(new TypeError('x is not a function'))['~e'].name).toBe('Error');
});

test('createWireProjection carries code and statusCode of a RequestError wrapping an AxiosHttp 404', () => {
  // The shape AxiosHttp throws for a non-2xx response: its own wrapper, with the
  // upstream code and status copied on, over the AxiosError.
  const axiosError = new Error('Request failed with status code 404');
  axiosError.name = 'AxiosError';
  axiosError.code = 'ERR_BAD_REQUEST';
  axiosError.response = { status: 404, statusText: 'Not Found' };
  const responseError = new Error('Http response "404: Not Found".', { cause: axiosError });
  responseError.code = 'ERR_BAD_REQUEST';
  responseError.statusCode = 404;
  const error = new RequestError(responseError.message, { cause: responseError });

  const node = serialize(error)['~e'];

  expect(node.code).toBe('ERR_BAD_REQUEST');
  expect(node.statusCode).toBe(404);
  expect(node.message).toBe('Something went wrong.');
});

test('createWireProjection carries code and statusCode read from the node', () => {
  const axiosError = new Error('Request failed with status code 404');
  axiosError.name = 'AxiosError';
  axiosError.code = 'ERR_BAD_REQUEST';
  axiosError.response = { status: 404, statusText: 'Not Found' };
  const error = new RequestError(axiosError.message, { cause: axiosError });

  const node = serialize(error)['~e'];

  expect(node.code).toBe('ERR_BAD_REQUEST');
  expect(node.statusCode).toBe(404);
  expect(node.response).toBeUndefined();
});

test('createWireProjection keeps the message, plain-object cause and metaData of a UserError', () => {
  const error = new UserError('Order rejected.', {
    blockId: 'submit_button',
    cause: { reason: 'out of stock' },
    metaData: { orderId: 'ord_1' },
    pageId: 'checkout',
  });

  const payload = serialize(error);

  expect(payload).toEqual({
    '~e': {
      name: 'UserError',
      message: 'Order rejected.',
      cause: { reason: 'out of stock' },
      metaData: { orderId: 'ord_1' },
      blockId: 'submit_button',
      pageId: 'checkout',
      isReject: false,
      isLowdefyError: true,
      requestId: 'rid-1',
    },
  });
});

test('createWireProjection emits the foreign Error cause of a UserError in the generic shape', () => {
  const error = new UserError('Thrown by config.', { cause: createForeignError() });

  const payload = serialize(error);

  expect(payload['~e'].message).toBe('Thrown by config.');
  expect(payload['~e'].cause).toEqual(genericForeignNode);
  expectNoInternals(payload);
});

test('createWireProjection keys the UserError branch on the name, not the class', () => {
  // A UserError revived by the serializer or thrown by another copy of
  // @lowdefy/errors fails instanceof but keeps its name.
  const error = new Error('Check your input.');
  error.name = 'UserError';
  error.isLowdefyError = true;

  expect(serialize(error)['~e'].message).toBe('Check your input.');
});

test('createWireProjection keeps the message of the three auth refusal classes', () => {
  const authorization = new Error('Forbidden.');
  authorization.name = 'AuthorizationError';
  const enrolment = new Error('Two-factor enrolment required.');
  enrolment.name = 'TwoFactorEnrolmentRequiredError';

  expect(serialize(new AuthenticationError())['~e']).toEqual({
    name: 'AuthenticationError',
    message: 'Authentication required.',
    requestId: 'rid-1',
    isLowdefyError: true,
  });
  expect(serialize(authorization)['~e'].name).toBe('AuthorizationError');
  expect(serialize(authorization)['~e'].message).toBe('Forbidden.');
  expect(serialize(enrolment)['~e'].name).toBe('TwoFactorEnrolmentRequiredError');
  expect(serialize(enrolment)['~e'].message).toBe('Two-factor enrolment required.');
});

test('createWireProjection translates the generic message into the active locale', () => {
  const i18n = {
    active: 'fr',
    defaultLocale: 'en-US',
    messages: { fr: { 'server.genericError': 'Une erreur est survenue.' } },
  };

  const payload = serialize(new RequestError('Request failed.'), { rid: 'rid-1', i18n });

  expect(payload['~e'].message).toBe('Une erreur est survenue.');
});

test('createWireProjection sets requestId to context.rid on every generic node', () => {
  const error = new UserError('Thrown by config.', {
    cause: createForeignError(),
    metaData: { upstream: new ServiceError('Service unavailable.') },
  });

  const payload = serialize(error, { rid: 'rid-42' });

  expect(payload['~e'].requestId).toBe('rid-42');
  expect(payload['~e'].cause.requestId).toBe('rid-42');
  expect(payload['~e'].metaData.upstream.requestId).toBe('rid-42');
});

test('createWireProjection omits requestId for a context without rid', () => {
  // A websocket broadcast has no single request behind it.
  const payload = serialize(new RequestError('Request failed.'), { i18n: undefined });

  expect('requestId' in payload['~e']).toBe(false);
  expect(payload['~e'].message).toBe('Something went wrong.');
});

test('createWireProjection drops a null configKey and keeps a set one', () => {
  expect('configKey' in serialize(new RequestError('Request failed.'))['~e']).toBe(false);
  expect(serialize(new ConfigError('Bad.', { configKey: 'abc123' }))['~e'].configKey).toBe(
    'abc123'
  );
});

test('createWireProjection keeps handled so the client does not log the error twice', () => {
  const error = new LowdefyInternalError('Unexpected condition.');
  error.handled = true;

  expect(serialize(error)['~e'].handled).toBe(true);
});

test('createWireProjection returns the wire message from project for a single error', () => {
  const project = createWireProjection(context);

  expect(project(createForeignError()).message).toBe('Something went wrong.');
  expect(project(new UserError('Check your input.')).message).toBe('Check your input.');
});
