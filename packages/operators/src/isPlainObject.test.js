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

import isPlainObject from './isPlainObject.js';

test('isPlainObject is true for object literals and null-prototype objects', () => {
  expect(isPlainObject({})).toBe(true);
  expect(isPlainObject({ a: 1 })).toBe(true);
  expect(isPlainObject(Object.create(null))).toBe(true);
});

test('isPlainObject is false for everything that is not a plain object', () => {
  class Instance {}
  expect(isPlainObject(null)).toBe(false);
  expect(isPlainObject(undefined)).toBe(false);
  expect(isPlainObject('text')).toBe(false);
  expect(isPlainObject([])).toBe(false);
  expect(isPlainObject(() => {})).toBe(false);
  expect(isPlainObject(new Date())).toBe(false);
  expect(isPlainObject(new Map())).toBe(false);
  expect(isPlainObject(new Instance())).toBe(false);
});
