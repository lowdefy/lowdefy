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

import containsFunction from './containsFunction.js';

test('containsFunction finds a function at the root or nested in objects and arrays', () => {
  expect(containsFunction(() => 1)).toBe(true);
  expect(containsFunction([{ field: 'a' }, { field: 'b', valueFormatter: () => 1 }])).toBe(true);
  expect(containsFunction({ a: { b: [1, { c: () => 1 }] } })).toBe(true);
});

test('containsFunction returns false for data without functions', () => {
  expect(containsFunction(null)).toBe(false);
  expect(containsFunction('text')).toBe(false);
  expect(containsFunction({ a: [1, 2, { b: new Date() }] })).toBe(false);
});

test('containsFunction terminates on cycles', () => {
  const value = { a: [] };
  value.a.push(value);
  expect(containsFunction(value)).toBe(false);
});

test('containsFunction does not walk into class instances', () => {
  class Instance {
    constructor() {
      this.method = () => 1;
    }
  }
  expect(containsFunction({ a: new Instance() })).toBe(false);
  expect(containsFunction(Object.assign(Object.create(null), { a: [() => 1] }))).toBe(true);
});
