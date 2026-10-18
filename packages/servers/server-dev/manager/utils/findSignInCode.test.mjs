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

import findSignInCode from './findSignInCode.mjs';

test('findSignInCode reads the code from the stock sign-in email text', () => {
  const text =
    'YOUR SIGN-IN CODE\n\nEnter this code on the sign-in page to continue.\n\n482913\n\nThis code expires in 5 minutes and can only be used once.';
  expect(findSignInCode({ text })).toEqual('482913');
});

test('findSignInCode ignores a number inside a sentence', () => {
  expect(findSignInCode({ text: 'Your order 123456 has shipped.' })).toBe(null);
  expect(findSignInCode({ text: 'Total\n12\n' })).toBe(null);
});

test('findSignInCode returns null for a message with no text', () => {
  expect(findSignInCode({ text: null })).toBe(null);
});
