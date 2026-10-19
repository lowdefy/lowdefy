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

import normaliseClickText from './normaliseClickText.js';

test('normaliseClickText collapses whitespace runs and trims', () => {
  expect(normaliseClickText('  Assign \n\t to   me ')).toEqual('Assign to me');
});

test('normaliseClickText returns null for empty and non-string values', () => {
  expect(normaliseClickText('   ')).toBeNull();
  expect(normaliseClickText('')).toBeNull();
  expect(normaliseClickText(42)).toBeNull();
  expect(normaliseClickText(null)).toBeNull();
  expect(normaliseClickText(undefined)).toBeNull();
});
