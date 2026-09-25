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

import readErrorCodes from './readErrorCodes.js';

test('readErrorCodes reads statusCode from an axios-shaped response status', () => {
  expect(readErrorCodes({ response: { status: 404 } })).toEqual({
    code: undefined,
    statusCode: 404,
  });
});

test('readErrorCodes skips a string status and falls through to response.status', () => {
  expect(readErrorCodes({ status: '500', response: { status: 502 } })).toEqual({
    code: undefined,
    statusCode: 502,
  });
});

test('readErrorCodes returns undefined statusCode when the only status is a string', () => {
  expect(readErrorCodes({ status: '500' })).toEqual({ code: undefined, statusCode: undefined });
});

test('readErrorCodes keeps a statusCode of 0 because it is a number', () => {
  expect(readErrorCodes({ statusCode: 0, status: 500 })).toEqual({
    code: undefined,
    statusCode: 0,
  });
});

test('readErrorCodes prefers statusCode over status over response.status', () => {
  expect(readErrorCodes({ statusCode: 401, status: 403, response: { status: 404 } })).toEqual({
    code: undefined,
    statusCode: 401,
  });
  expect(readErrorCodes({ status: 403, response: { status: 404 } })).toEqual({
    code: undefined,
    statusCode: 403,
  });
});

test('readErrorCodes reads a Node system error code', () => {
  const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
  error.code = 'ECONNREFUSED';
  expect(readErrorCodes(error)).toEqual({ code: 'ECONNREFUSED', statusCode: undefined });
});

test('readErrorCodes reads a Postgres SQLSTATE code', () => {
  expect(readErrorCodes({ code: '23505' })).toEqual({ code: '23505', statusCode: undefined });
});

test('readErrorCodes reads a numeric Mongo code as-is', () => {
  expect(readErrorCodes({ code: 11000 })).toEqual({ code: 11000, statusCode: undefined });
});

test('readErrorCodes returns both undefined for null, undefined and non-objects', () => {
  const none = { code: undefined, statusCode: undefined };
  expect(readErrorCodes(null)).toEqual(none);
  expect(readErrorCodes(undefined)).toEqual(none);
  expect(readErrorCodes('ECONNREFUSED')).toEqual(none);
  expect(readErrorCodes(404)).toEqual(none);
});

test('readErrorCodes returns undefined statusCode when response has no status', () => {
  expect(readErrorCodes({ response: {} })).toEqual({ code: undefined, statusCode: undefined });
  expect(readErrorCodes({ response: null })).toEqual({ code: undefined, statusCode: undefined });
});
