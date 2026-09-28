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

import normalizeOptions from './normalizeOptions.js';
import resolveOption from './resolveOption.js';

test('resolveOption finds an option by value, and by string form for map options', () => {
  const options = normalizeOptions({ 1: 'One', true: 'Yes' });
  expect(resolveOption({ options, value: 1 }).label).toBe('One');
  expect(resolveOption({ options, value: true }).label).toBe('Yes');
  expect(resolveOption({ options: normalizeOptions([1]), value: 1 }).label).toBe('1');
  expect(resolveOption({ options, value: 2 })).toBeUndefined();
  expect(resolveOption({ options, value: null })).toBeUndefined();
  expect(resolveOption({ options, value: { a: 1 } })).toBeUndefined();
  expect(resolveOption({ options: undefined, value: 1 })).toBeUndefined();
});
