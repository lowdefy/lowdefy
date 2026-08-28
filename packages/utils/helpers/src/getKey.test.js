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

import getKey from './getKey.js';
import { ReservedKeyError } from './ReservedKeyError.js';

test('getKey returns the value of an existing key', () => {
  expect(getKey({ a: 1 }, 'a')).toBe(1);
});

test('getKey returns undefined when the key is absent and no default is given', () => {
  expect(getKey({ a: 1 }, 'b')).toBe(undefined);
});

test('getKey returns the default value when the key is absent', () => {
  expect(getKey({ a: 1 }, 'b', 'default')).toBe('default');
});

test('getKey returns a stored undefined value rather than the default', () => {
  expect(getKey({ a: undefined }, 'a', 'default')).toBe(undefined);
});

test('getKey returns falsy stored values rather than the default', () => {
  expect(getKey({ a: 0 }, 'a', 'default')).toBe(0);
  expect(getKey({ a: null }, 'a', 'default')).toBe(null);
  expect(getKey({ a: '' }, 'a', 'default')).toBe('');
});

test('getKey throws ReservedKeyError for __proto__ instead of returning a value', () => {
  expect(() => getKey({}, '__proto__')).toThrow(ReservedKeyError);
});

test('getKey throws ReservedKeyError for __proto__ instead of returning the default', () => {
  expect(() => getKey({}, '__proto__', 'fallback')).toThrow(ReservedKeyError);
});

test('getKey reads own properties that shadow Object.prototype methods', () => {
  expect(getKey({ hasOwnProperty: 'x' }, 'hasOwnProperty')).toBe('x');
});

test('getKey does not leak inherited Object.prototype methods', () => {
  expect(getKey({}, 'toString')).toBe(undefined);
  expect(getKey({}, 'toString', 'default')).toBe('default');
});

test('getKey treats a dotted key as a literal key and does not split it', () => {
  expect(getKey({ 'a.b': 1, a: { b: 2 } }, 'a.b')).toBe(1);
});

test('getKey reads from a null prototype target', () => {
  const target = Object.create(null);
  target.a = 1;
  expect(getKey(target, 'a')).toBe(1);
  expect(getKey(target, 'b', 'default')).toBe('default');
});

test('getKey throws TypeError when target is null', () => {
  expect(() => getKey(null, 'a')).toThrow(TypeError);
  expect(() => getKey(null, 'a')).toThrow('getKey: target must be a plain object');
});

test('getKey throws TypeError when target is an array', () => {
  expect(() => getKey([], 'a')).toThrow(TypeError);
});

test('getKey throws TypeError when key is a number', () => {
  expect(() => getKey({}, 42)).toThrow(TypeError);
  expect(() => getKey({}, 42)).toThrow('getKey: key must be a string');
});
