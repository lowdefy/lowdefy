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

import cn from './cn.js';

test('cn returns the classes when given a string', () => {
  expect(cn('p-4 shadow-lg')).toBe('p-4 shadow-lg');
});

test('cn joins an array of class strings', () => {
  expect(cn(['p-4', 'shadow-lg'])).toBe('p-4 shadow-lg');
});

test('cn keeps only the truthy keys of a { className: boolean } object', () => {
  expect(cn({ 'p-4': true, 'shadow-lg': false, 'text-red-500': true })).toBe('p-4 text-red-500');
});

test('cn merges conflicting tailwind classes keeping the last', () => {
  expect(cn(['p-4', 'p-8'])).toBe('p-8');
});

test('cn returns an empty string for none values', () => {
  expect(cn(undefined)).toBe('');
  expect(cn(null)).toBe('');
});
