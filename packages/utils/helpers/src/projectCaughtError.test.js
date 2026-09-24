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

import { RequestError, UserError } from '@lowdefy/errors';

import get from './get.js';
import projectCaughtError from './projectCaughtError.js';

const SECRET = 'sk_live_abcdef123456';

function scrub(value) {
  return value.split(SECRET).join('[REDACTED]');
}

// The shape AxiosHttp throws for a non-2xx response, wrapped by the request layer.
function createRequestError() {
  const axiosError = new Error('Request failed with status code 404');
  axiosError.name = 'AxiosError';
  axiosError.code = 'ERR_BAD_REQUEST';
  axiosError.response = { status: 404, statusText: 'Not Found', data: { token: SECRET } };
  axiosError.config = { headers: { authorization: `Bearer ${SECRET}` } };
  const error = new RequestError('Http response "404: Not Found".', {
    cause: axiosError,
    configKey: 'key-1',
    received: { headers: { authorization: `Bearer ${SECRET}` } },
  });
  error.source = 'requests/users.yaml:4';
  error.location = 'root.pages[0:home].requests[0:users]';
  error.handled = true;
  return error;
}

test('projectCaughtError keeps name, message, code, statusCode, handled and cause of a RequestError and nothing else', () => {
  const result = projectCaughtError(createRequestError());

  expect(result).toBeInstanceOf(RequestError);
  expect(result.message).toBe('Http response "404: Not Found".');
  expect(result.name).toBe('RequestError');
  expect(result.code).toBe('ERR_BAD_REQUEST');
  expect(result.statusCode).toBe(404);
  expect(result.handled).toBe(true);
  expect(Object.getOwnPropertyNames(result).sort()).toEqual(
    ['cause', 'code', 'handled', 'message', 'name', 'statusCode'].sort()
  );

  expect(result.cause).toBeInstanceOf(Error);
  expect(result.cause.message).toBe('Request failed with status code 404');
  expect(Object.getOwnPropertyNames(result.cause).sort()).toEqual(
    ['code', 'message', 'name', 'statusCode'].sort()
  );
  expect(result.cause.name).toBe('AxiosError');
  expect(result.cause.statusCode).toBe(404);

  for (const key of ['received', 'source', 'config', 'configKey', 'location', 'stack']) {
    expect(Object.hasOwn(result, key)).toBe(false);
    expect(Object.hasOwn(result.cause, key)).toBe(false);
  }
  expect(result.stack).toBeUndefined();
});

test('projectCaughtError omits handled when the caught error does not set it', () => {
  const result = projectCaughtError(new RequestError('Request failed.'));

  expect('handled' in result).toBe(false);
});

test('projectCaughtError makes message non-enumerable so JSON.stringify drops it', () => {
  const result = projectCaughtError(createRequestError());

  expect(Object.keys(result)).not.toContain('message');
  const sent = JSON.parse(JSON.stringify({ error: result })).error;
  expect(sent.message).toBeUndefined();
  expect(sent.name).toBe('RequestError');
  expect(sent.cause.message).toBeUndefined();
});

test('projectCaughtError message is readable through get at the top level and down the cause', () => {
  const result = projectCaughtError(createRequestError());

  expect(get(result, 'message')).toBe('Http response "404: Not Found".');
  expect(get(result, 'cause.message')).toBe('Request failed with status code 404');
});

test('projectCaughtError keeps the plain-object cause and metaData of a UserError, scrubbed', () => {
  const error = new UserError('Order rejected.', {
    cause: { reason: 'out of stock', key: SECRET },
    metaData: { orderId: 'ord_1', tokens: [SECRET] },
    blockId: 'submit_button',
  });

  const result = projectCaughtError(error, { scrub });

  expect(result).toBeInstanceOf(UserError);
  expect(result.cause).toEqual({ reason: 'out of stock', key: '[REDACTED]' });
  expect(result.metaData).toEqual({ orderId: 'ord_1', tokens: ['[REDACTED]'] });
  expect(error.cause.key).toBe(SECRET);
  expect(error.metaData.tokens[0]).toBe(SECRET);
  expect('blockId' in result).toBe(false);
});

test('projectCaughtError drops a non-Error cause of a class other than UserError', () => {
  const error = new RequestError('Request failed.', { cause: { body: SECRET } });

  const result = projectCaughtError(error);

  expect('cause' in result).toBe(false);
});

test('projectCaughtError scrubs a planted secret from the message, a cause message and metaData', () => {
  const cause = new Error(`connect with key ${SECRET} failed`);
  const error = new UserError(`Rejected with ${SECRET}.`, {
    cause,
    metaData: { nested: { value: `key=${SECRET}` } },
  });

  const result = projectCaughtError(error, { scrub });

  expect(result.message).toBe('Rejected with [REDACTED].');
  expect(result.cause.message).toBe('connect with key [REDACTED] failed');
  expect(result.metaData).toEqual({ nested: { value: 'key=[REDACTED]' } });
});

test('projectCaughtError scrubs a string code and leaves a numeric code as it is', () => {
  const stringCode = new Error('failed');
  stringCode.code = `E_${SECRET}`;
  const numericCode = new Error('failed');
  numericCode.code = 11000;

  expect(projectCaughtError(stringCode, { scrub }).code).toBe('E_[REDACTED]');
  expect(projectCaughtError(numericCode, { scrub }).code).toBe(11000);
});

test('projectCaughtError uses Error for a name that is not a Lowdefy class', () => {
  const error = new TypeError('x is not a function');
  const constructorNamed = new Error('odd');
  constructorNamed.name = 'constructor';

  const result = projectCaughtError(error);

  expect(Object.getPrototypeOf(result)).toBe(Error.prototype);
  expect(result.name).toBe('TypeError');
  expect(Object.getPrototypeOf(projectCaughtError(constructorNamed))).toBe(Error.prototype);
});

test('projectCaughtError wraps a thrown string or object in an Error', () => {
  const fromString = projectCaughtError('boom');
  const fromObject = projectCaughtError({ reason: 'x' });

  expect(fromString).toBeInstanceOf(Error);
  expect(fromString.message).toBe('boom');
  expect(fromString.name).toBe('Error');
  expect(fromObject.message).toBe('[object Object]');
});

test('projectCaughtError stops a circular cause chain at the first repeat', () => {
  const first = new Error('first');
  const second = new Error('second', { cause: first });
  first.cause = second;

  const result = projectCaughtError(first);

  expect(result.cause.message).toBe('second');
  expect('cause' in result.cause).toBe(false);
});
