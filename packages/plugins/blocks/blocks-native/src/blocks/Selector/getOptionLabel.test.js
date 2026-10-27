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

import getOptionLabel from './getOptionLabel.js';

test('getOptionLabel shows a primitive option as text', () => {
  expect(getOptionLabel({ option: 3 })).toBe('3');
  expect(getOptionLabel({ option: 'a' })).toBe('a');
});

test('getOptionLabel drops html tags from a label', () => {
  expect(getOptionLabel({ option: { label: '<b>Bold</b> name', value: 1 } })).toBe('Bold name');
});

test('getOptionLabel falls back to the value when the label is not a string', () => {
  expect(getOptionLabel({ option: { value: 7 } })).toBe('7');
});

test('getOptionLabel keeps a long run of unclosed < as text without backtracking', () => {
  const label = '<'.repeat(100000);
  const start = performance.now();
  expect(getOptionLabel({ option: { label, value: 1 } })).toBe(label);
  expect(performance.now() - start).toBeLessThan(1000);
});
