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

import unsetKey from './unsetKey.js';
import { ReservedKeyError } from './ReservedKeyError.js';

test('unsetKey deletes the key and returns the mutated target', () => {
  const target = { a: 1, b: 2 };
  expect(unsetKey(target, 'a')).toBe(target);
  expect(target).toEqual({ b: 2 });
});

test('unsetKey no-ops when the key is absent', () => {
  expect(unsetKey({ a: 1 }, 'b')).toEqual({ a: 1 });
});

test('unsetKey treats a dotted key as a literal key and does not split it', () => {
  const target = { 'a.b': 1, a: { b: 2 } };
  unsetKey(target, 'a.b');
  expect(target).toEqual({ a: { b: 2 } });
});

test('unsetKey deletes from a null prototype target', () => {
  const target = Object.create(null);
  target.a = 1;
  unsetKey(target, 'a');
  expect(Object.keys(target)).toEqual([]);
});

test('unsetKey throws ReservedKeyError for the __proto__ key', () => {
  expect(() => unsetKey({}, '__proto__')).toThrow(ReservedKeyError);
});

test('unsetKey throws TypeError when target is null', () => {
  expect(() => unsetKey(null, 'a')).toThrow(TypeError);
  expect(() => unsetKey(null, 'a')).toThrow('unsetKey: target must be a plain object');
});

test('unsetKey throws TypeError when target is an array', () => {
  expect(() => unsetKey([], 'a')).toThrow(TypeError);
});

test('unsetKey throws TypeError when key is a number', () => {
  expect(() => unsetKey({}, 42)).toThrow(TypeError);
  expect(() => unsetKey({}, 42)).toThrow('unsetKey: key must be a string');
});

test('unsetKey removing a shadowing own property restores the inherited method', () => {
  const target = { toString: 'x' };
  unsetKey(target, 'toString');
  expect(Object.hasOwn(target, 'toString')).toBe(false);
  expect(target.toString).toBe(Object.prototype.toString);
});
