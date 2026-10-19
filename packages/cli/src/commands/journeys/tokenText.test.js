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

import tokenText from './tokenText.js';
import hashId from './pull/hashId.js';

const salt = Buffer.from('a'.repeat(64), 'hex');

test('tokenText gives t_ and 16 hex characters, the same for the same text', () => {
  const token = tokenText({ salt, text: 'Acme Ltd' });
  expect(token).toMatch(/^t_[0-9a-f]{16}$/);
  expect(tokenText({ salt, text: 'Acme Ltd' })).toEqual(token);
  expect(tokenText({ salt, text: 'Acme Ltd.' })).not.toEqual(token);
});

test('tokenText changes with the salt', () => {
  const other = Buffer.from('b'.repeat(64), 'hex');
  expect(tokenText({ salt: other, text: 'Acme Ltd' })).not.toEqual(
    tokenText({ salt, text: 'Acme Ltd' })
  );
});

test('tokenText never equals a person or org hash of the same value', () => {
  const token = tokenText({ salt, text: 'user-1' });
  expect(token.slice(2)).not.toEqual(hashId({ salt, id: 'user-1', prefix: 'p_' }).slice(2));
});

test('tokenText returns null for empty or missing text', () => {
  expect(tokenText({ salt, text: null })).toBeNull();
  expect(tokenText({ salt, text: undefined })).toBeNull();
  expect(tokenText({ salt, text: '' })).toBeNull();
});
