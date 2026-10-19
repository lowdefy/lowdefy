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

import hashId from './hashId.js';

const salt = Buffer.alloc(32, 7);

test('hashId prefixes the first 16 hex characters of the HMAC', () => {
  const hash = hashId({ salt, id: 'person-1', prefix: 'p_' });
  expect(hash).toMatch(/^p_[0-9a-f]{16}$/);
  expect(hashId({ salt, id: 'person-1', prefix: 'p_' })).toBe(hash);
});

test('hashId gives different hashes under different salts', () => {
  expect(hashId({ salt, id: 'person-1', prefix: 'p_' })).not.toBe(
    hashId({ salt: Buffer.alloc(32, 8), id: 'person-1', prefix: 'p_' })
  );
});

test('hashId returns null for a missing id', () => {
  expect(hashId({ salt, id: null, prefix: 'o_' })).toBeNull();
  expect(hashId({ salt, id: undefined, prefix: 'o_' })).toBeNull();
  expect(hashId({ salt, id: '', prefix: 'o_' })).toBeNull();
});
