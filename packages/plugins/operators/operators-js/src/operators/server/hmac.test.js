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

import crypto from 'crypto';
import { ServerParser } from '@lowdefy/operators';

import hmac from './hmac.js';
import * as operatorsClient from '../../operatorsClient.js';
import * as operatorsServer from '../../operatorsServer.js';

console.error = () => {};

function expected(algorithm, key, data) {
  return crypto.createHmac(algorithm, key).update(data, 'utf8').digest('hex');
}

test('_hmac.sha256 matches RFC 4231 test case 2', () => {
  expect(
    hmac({
      params: { key: 'Jefe', data: 'what do ya want for nothing?' },
      location: 'locationId',
      methodName: 'sha256',
    })
  ).toEqual('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
});

test('_hmac.sha512 matches RFC 4231 test case 2', () => {
  expect(
    hmac({
      params: { key: 'Jefe', data: 'what do ya want for nothing?' },
      location: 'locationId',
      methodName: 'sha512',
    })
  ).toEqual(
    '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737'
  );
});

test.each(['sha256', 'sha512'])('_hmac.%s matches crypto.createHmac on UTF-8 strings', (method) => {
  const key = 'root-sécret-🔑';
  const data = '1717171717.{"ticket":"café"}';
  expect(hmac({ params: { key, data }, location: 'locationId', methodName: method })).toEqual(
    expected(method, key, data)
  );
});

test('_hmac.sha256 output works as the key of the next call', () => {
  const appSecret = hmac({
    params: { key: 'root', data: 'app:1' },
    location: 'locationId',
    methodName: 'sha256',
  });
  expect(
    hmac({
      params: { key: appSecret, data: 'ts.body' },
      location: 'locationId',
      methodName: 'sha256',
    })
  ).toEqual(expected('sha256', expected('sha256', 'root', 'app:1'), 'ts.body'));
});

test('_hmac derives and signs when nested in a server parser', () => {
  const parser = new ServerParser({
    operators: operatorsServer,
    payload: {},
    secrets: { ROOT: 'root' },
  });
  const { output, errors } = parser.parse({
    input: {
      '_hmac.sha256': {
        key: { '_hmac.sha256': { key: { _secret: 'ROOT' }, data: 'app:1' } },
        data: 'ts.body',
      },
    },
    location: 'locationId',
  });
  expect(errors).toEqual([]);
  expect(output).toEqual(expected('sha256', expected('sha256', 'root', 'app:1'), 'ts.body'));
});

test.each([
  ['key', { key: 10, data: 'x' }],
  ['key', { data: 'x' }],
  ['key', { key: null, data: 'x' }],
  ['data', { key: 'k', data: { a: 1 } }],
  ['data', { key: 'k' }],
])('_hmac.sha256 refuses a %s that is not a string: %j', (field, params) => {
  expect(() => hmac({ params, location: 'locationId', methodName: 'sha256' })).toThrow(
    `_hmac.sha256 requires "${field}" to be a string.`
  );
});

test('_hmac.sha512 refuses a data that is not a string', () => {
  expect(() =>
    hmac({ params: { key: 'k', data: 3 }, location: 'locationId', methodName: 'sha512' })
  ).toThrow('_hmac.sha512 requires "data" to be a string.');
});

test.each([['a string'], [10], [null], [['k', 'd']]])(
  '_hmac.sha256 refuses params %j',
  (params) => {
    expect(() => hmac({ params, location: 'locationId', methodName: 'sha256' })).toThrow(
      '_hmac.sha256 accepts one of the following types: object.'
    );
  }
);

test('_hmac refuses an unknown method', () => {
  expect(() =>
    hmac({ params: { key: 'k', data: 'd' }, location: 'locationId', methodName: 'md5' })
  ).toThrow('_hmac.md5 is not supported, use one of the following: sha256, sha512.');
});

test('_hmac is a server operator only', () => {
  expect(operatorsServer._hmac).toBe(hmac);
  expect(operatorsClient._hmac).toBeUndefined();
  expect(hmac.dynamic).toBe(false);
});
