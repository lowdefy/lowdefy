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

import { expect, test } from 'vitest';

import isDataStoreGone from './isDataStoreGone.js';

function driverError(name, message = 'failed') {
  const error = new Error(message);
  error.name = name;
  return error;
}

test('isDataStoreGone is true for a refused connection to a mongod that exited', () => {
  expect(
    isDataStoreGone(driverError('MongoNetworkError', 'connect ECONNREFUSED 127.0.0.1:53773'))
  ).toBe(true);
});

test('isDataStoreGone is true for the driver errors of a replica set that is gone', () => {
  for (const name of [
    'MongoServerSelectionError',
    'MongoTopologyClosedError',
    'MongoNotConnectedError',
  ]) {
    expect(isDataStoreGone(driverError(name)), name).toBe(true);
  }
});

test('isDataStoreGone is true for a refused connect carried as the cause', () => {
  const error = driverError('MongoNetworkError', 'connection failed');
  error.cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  expect(isDataStoreGone(error)).toBe(true);
});

test('isDataStoreGone is false for a closed connection, which may pass', () => {
  expect(isDataStoreGone(driverError('MongoNetworkError', 'connection closed'))).toBe(false);
});

test('isDataStoreGone is false for a network timeout, which a busy mongod can raise', () => {
  expect(isDataStoreGone(driverError('MongoNetworkTimeoutError'))).toBe(false);
});

test('isDataStoreGone is false for other errors and for no error', () => {
  expect(isDataStoreGone(driverError('MongoServerError'))).toBe(false);
  expect(isDataStoreGone(new Error('Data set load failed'))).toBe(false);
  expect(isDataStoreGone(undefined)).toBe(false);
});
