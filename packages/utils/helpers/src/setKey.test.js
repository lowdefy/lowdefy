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

import setKey from './setKey.js';
import { ReservedKeyError } from './ReservedKeyError.js';

test('setKey assigns the value on an empty target', () => {
  const target = {};
  setKey(target, 'foo', 1);
  expect(target.foo).toBe(1);
});

test('setKey returns the same target reference so calls are chainable', () => {
  const target = {};
  expect(setKey(target, 'foo', 1)).toBe(target);
  expect(setKey(setKey(target, 'a', 1), 'b', 2)).toEqual({ foo: 1, a: 1, b: 2 });
});

test('setKey preserves existing keys when adding a new one', () => {
  expect(setKey({ a: 1 }, 'b', 2)).toEqual({ a: 1, b: 2 });
});

test('setKey overwrites an existing key', () => {
  expect(setKey({ a: 1 }, 'a', 2)).toEqual({ a: 2 });
});

test('setKey throws ReservedKeyError for the __proto__ key', () => {
  expect(() => setKey({}, '__proto__', 1)).toThrow(ReservedKeyError);
  expect(() => setKey({}, '__proto__', 1)).toThrow('Reserved key "__proto__"');
});

test('setKey throws ReservedKeyError for the constructor key', () => {
  expect(() => setKey({}, 'constructor', 1)).toThrow(ReservedKeyError);
});

test('setKey throws ReservedKeyError for the __defineGetter__ key', () => {
  expect(() => setKey({}, '__defineGetter__', 1)).toThrow(ReservedKeyError);
});

test('setKey does not pollute Object.prototype when given a reserved key', () => {
  expect(() => setKey({}, '__proto__', { polluted: true })).toThrow(ReservedKeyError);
  expect({}.polluted).toBeUndefined();
});

test('setKey throws TypeError when target is null', () => {
  expect(() => setKey(null, 'a', 1)).toThrow(TypeError);
  expect(() => setKey(null, 'a', 1)).toThrow('setKey: target must be a plain object');
});

test('setKey throws TypeError when target is undefined', () => {
  expect(() => setKey(undefined, 'a', 1)).toThrow(TypeError);
});

test('setKey throws TypeError when target is a number', () => {
  expect(() => setKey(42, 'a', 1)).toThrow(TypeError);
});

test('setKey throws TypeError when target is an array', () => {
  expect(() => setKey([], 'a', 1)).toThrow(TypeError);
});

test('setKey throws TypeError when target is a Map', () => {
  expect(() => setKey(new Map(), 'a', 1)).toThrow(TypeError);
});

test('setKey throws TypeError when key is a number', () => {
  expect(() => setKey({}, 42, 1)).toThrow(TypeError);
  expect(() => setKey({}, 42, 1)).toThrow('setKey: key must be a string');
});

test('setKey throws TypeError when key is a symbol', () => {
  expect(() => setKey({}, Symbol('x'), 1)).toThrow(TypeError);
});

test('setKey treats a dotted key as a literal key and does not split it', () => {
  const target = setKey({}, 'a.b', 1);
  expect(target).toEqual({ 'a.b': 1 });
  expect(target.a).toBeUndefined();
});

test('setKey writes to a null prototype target', () => {
  const target = Object.create(null);
  setKey(target, 'a', 1);
  expect(target.a).toBe(1);
});

test('setKey throws ReservedKeyError on a null prototype target', () => {
  expect(() => setKey(Object.create(null), '__proto__', 1)).toThrow(ReservedKeyError);
});
