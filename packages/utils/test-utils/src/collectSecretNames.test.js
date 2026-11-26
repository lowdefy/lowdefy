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

import collectSecretNames from './collectSecretNames.js';

function collect(value) {
  const names = new Set();
  collectSecretNames({ names, value });
  return [...names].sort();
}

test('collectSecretNames finds _secret names at any depth, in objects and arrays', () => {
  expect(
    collect({
      properties: {
        databaseUri: { _secret: 'MONGODB_URI', '~k': 'a' },
        headers: [{ authorization: { '_string.concat': ['Bearer ', { _secret: 'API_KEY' }] } }],
      },
      routine: { '~arr': [{ properties: { key: { _secret: 'STRIPE_KEY' } } }] },
    })
  ).toEqual(['API_KEY', 'MONGODB_URI', 'STRIPE_KEY']);
});

test('collectSecretNames reads the key of the object form of _secret', () => {
  expect(collect({ port: { _secret: { key: 'SMTP_PORT', default: '1025' } } })).toEqual([
    'SMTP_PORT',
  ]);
});

test('collectSecretNames skips a _secret whose name another operator computes', () => {
  expect(collect({ value: { _secret: { _payload: 'name' } } })).toEqual([]);
  expect(collect({ value: { _secret: true } })).toEqual([]);
});

test('collectSecretNames returns nothing for values without the operator', () => {
  expect(collect(null)).toEqual([]);
  expect(collect('_secret')).toEqual([]);
  expect(collect({ secret: 'X', nested: [1, 'a', null] })).toEqual([]);
});
