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

import crypto from 'node:crypto';

import verifyIntegrity from './verifyIntegrity.js';

const data = Buffer.from('tarball');
const other = Buffer.from('other');
const name = 'Package "p@1.0.0" tarball';

function hash(algorithm, value) {
  return `${algorithm}-${crypto.createHash(algorithm).update(value).digest('base64')}`;
}

test.each([
  ['a matching sha512 hash', hash('sha512', data)],
  ['a matching sha256 hash on its own', hash('sha256', data)],
  [
    'a matching sha512 hash next to a wrong sha256 hash',
    `${hash('sha256', other)} ${hash('sha512', data)}`,
  ],
  ['a matching hash with options', `${hash('sha512', data)}?foo`],
  [
    'a matching hash next to malformed and unsupported entries',
    `garbage md5-abc ${hash('sha384', data)}`,
  ],
])('verifyIntegrity accepts %s', (_, integrity) => {
  expect(() => verifyIntegrity({ data, integrity, name })).not.toThrow();
});

test.each([
  [
    'a wrong sha512 hash next to a matching sha256 hash',
    `${hash('sha256', data)} ${hash('sha512', other)}`,
    'does not match the sha512 integrity hash',
  ],
  ['no integrity', undefined, 'has no sha512, sha384 or sha256 integrity hash'],
  ['only a sha1 hash', hash('sha1', data), 'has no sha512, sha384 or sha256 integrity hash'],
  ['only malformed entries', 'garbage md5', 'has no sha512, sha384 or sha256 integrity hash'],
])('verifyIntegrity rejects %s', (_, integrity, message) => {
  expect(() => verifyIntegrity({ data, integrity, name })).toThrow(`${name} ${message}`);
});
