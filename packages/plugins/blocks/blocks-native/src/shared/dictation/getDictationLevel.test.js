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

import getDictationLevel from './getDictationLevel.js';

test('getDictationLevel gives 0 for inaudible input', () => {
  expect(getDictationLevel({ value: -2 })).toBe(0);
  expect(getDictationLevel({ value: 0 })).toBe(0);
});

test('getDictationLevel scales audible input from 0 to 1', () => {
  expect(getDictationLevel({ value: 2.5 })).toBe(0.25);
  expect(getDictationLevel({ value: 10 })).toBe(1);
});

test('getDictationLevel caps loud input at 1', () => {
  expect(getDictationLevel({ value: 14 })).toBe(1);
});

test('getDictationLevel gives 0 for a value that is not a number', () => {
  expect(getDictationLevel({ value: undefined })).toBe(0);
  expect(getDictationLevel({ value: NaN })).toBe(0);
});
