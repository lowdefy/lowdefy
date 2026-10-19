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

import { createHash } from 'node:crypto';

import sha256Hex from './sha256Hex.js';

test('sha256Hex matches node crypto across padding boundaries and several blocks', () => {
  [0, 1, 20, 53, 54, 55, 56, 62, 63, 64, 65, 119, 120, 128, 300].forEach((length) => {
    const text = 'u'.repeat(length);
    expect(sha256Hex(text)).toBe(createHash('sha256').update(text).digest('hex'));
  });
});

test('sha256Hex hashes the UTF-8 bytes of the text', () => {
  const text = 'ü漢😀';
  expect(sha256Hex(text)).toBe(createHash('sha256').update(text, 'utf8').digest('hex'));
});
