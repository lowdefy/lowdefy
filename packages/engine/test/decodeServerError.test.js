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

import decodeServerError, { getDevError } from '../src/decodeServerError.js';

const wire = {
  name: 'RequestError',
  message: 'Something went wrong.',
  code: 'ECONNREFUSED',
  configKey: 'key-1',
  requestId: 'rid-1',
  isLowdefyError: true,
  handled: true,
};

const prodPayload = { '~e': wire };

const devPayload = {
  '~e': wire,
  devError: {
    '~e': {
      name: 'RequestError',
      message: 'connect ECONNREFUSED 10.0.0.5:27017',
      code: 'ECONNREFUSED',
      configKey: 'key-1',
      requestId: 'rid-1',
      stack: 'RequestError: connect ECONNREFUSED 10.0.0.5:27017\n    at connect',
    },
  },
};

test('decodeServerError returns null and undefined unchanged', () => {
  expect(decodeServerError(null)).toBe(null);
  expect(decodeServerError(undefined)).toBe(undefined);
});

test('decodeServerError decodes a prod payload to the wire error with no dev error', () => {
  const error = decodeServerError(prodPayload);
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe('RequestError');
  expect(error.message).toBe('Something went wrong.');
  expect(error.code).toBe('ECONNREFUSED');
  expect(error.requestId).toBe('rid-1');
  expect(error.isLowdefyError).toBe(true);
  expect(error.handled).toBe(true);
  expect(getDevError(error)).toBeUndefined();
});

test('decodeServerError keeps a dev payload devError off the decoded error', () => {
  const error = decodeServerError(devPayload);
  expect(error.message).toBe('Something went wrong.');
  expect(Object.getOwnPropertyNames(error)).not.toContain('devError');
  expect(error.devError).toBeUndefined();
});

test('getDevError returns the full error recorded for a dev payload', () => {
  const error = decodeServerError(devPayload);
  const devError = getDevError(error);
  expect(devError).toBeInstanceOf(Error);
  expect(devError.name).toBe('RequestError');
  expect(devError.message).toBe('connect ECONNREFUSED 10.0.0.5:27017');
  expect(devError.requestId).toBe('rid-1');
  expect(devError.stack).toContain('at connect');
});

test('decodeServerError does not mutate the payload', () => {
  const payload = JSON.parse(JSON.stringify(devPayload));
  decodeServerError(payload);
  expect(payload).toEqual(devPayload);
});

test('getDevError returns undefined for an error that was not decoded from a payload', () => {
  expect(getDevError(new Error('local'))).toBeUndefined();
});
