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

import createTokenResolver from './createTokenResolver.js';
import tokenText from './tokenText.js';

const salt = Buffer.alloc(32, 7);

test('createTokenResolver resolves the token of a config string to the string', () => {
  const resolve = createTokenResolver({ salt, texts: new Set(['Assign', 'Delete']) });
  expect(resolve(tokenText({ salt, text: 'Assign' }))).toEqual('Assign');
  expect(resolve(tokenText({ salt, text: 'Delete' }))).toEqual('Delete');
});

test('createTokenResolver resolves any other token to null', () => {
  const resolve = createTokenResolver({ salt, texts: new Set(['Assign']) });
  expect(resolve(tokenText({ salt, text: 'Acme Ltd' }))).toBeNull();
  expect(resolve(tokenText({ salt: Buffer.alloc(32, 8), text: 'Assign' }))).toBeNull();
  expect(resolve(undefined)).toBeNull();
});
