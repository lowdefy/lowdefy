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

import { projectCaughtError } from '@lowdefy/helpers';

import _error from './error.js';

function caughtError() {
  const cause = new Error('Http response "404: Not Found".');
  cause.statusCode = 404;
  cause.code = 'ERR_BAD_REQUEST';
  const error = new Error('Request failed.', { cause });
  error.name = 'RequestError';
  error.received = { token: 'runtime-token' };
  return projectCaughtError(error);
}

test('_error true returns the caught error itself', () => {
  const error = caughtError();
  expect(_error({ error, location: 'location', params: true })).toBe(error);
});

test('_error all true returns the caught error itself', () => {
  const error = caughtError();
  expect(_error({ error, location: 'location', params: { all: true } })).toBe(error);
});

test('_error true keeps the message off JSON so a plugin payload does not carry it', () => {
  const error = caughtError();
  const serialized = JSON.parse(JSON.stringify({ body: _error({ error, params: true }) }));
  expect(serialized.body.message).toBeUndefined();
  expect(serialized.body.name).toEqual('RequestError');
});

test('_error reads a key of the caught error', () => {
  const error = caughtError();
  expect(_error({ error, location: 'location', params: 'message' })).toEqual('Request failed.');
  expect(_error({ error, location: 'location', params: 'name' })).toEqual('RequestError');
  expect(_error({ error, location: 'location', params: 'cause.statusCode' })).toEqual(404);
});

test('_error reads a key with a default when the key does not exist', () => {
  const error = caughtError();
  expect(
    _error({ error, location: 'location', params: { key: 'missing', default: 'fallback' } })
  ).toEqual('fallback');
});

test('_error does not expose the caught error received value', () => {
  const error = caughtError();
  expect(_error({ error, location: 'location', params: 'received' })).toBeNull();
});

test('_error returns null outside a catch', () => {
  expect(_error({ error: null, location: 'location', params: true })).toBeNull();
  expect(_error({ location: 'location', params: { all: true } })).toBeNull();
  expect(_error({ error: null, location: 'location', params: 'message' })).toBeNull();
});

test('_error returns the default outside a catch', () => {
  expect(
    _error({ error: null, location: 'location', params: { key: 'message', default: 'none' } })
  ).toEqual('none');
});

test('_error throws on invalid params', () => {
  expect(() => _error({ error: null, location: 'location', params: [] })).toThrow(
    '_error params must be of type string, integer, boolean or object.'
  );
});

test('_error is dynamic', () => {
  expect(_error.dynamic).toBe(true);
});
