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

import { expect, test } from 'vitest';

import deepFreeze from './deepFreeze.js';

test('deepFreeze freezes nested objects and arrays and returns the value', () => {
  const value = { a: { b: [{ c: 1 }] } };
  expect(deepFreeze(value)).toBe(value);
  expect(Object.isFrozen(value.a)).toBe(true);
  expect(Object.isFrozen(value.a.b)).toBe(true);
  expect(Object.isFrozen(value.a.b[0])).toBe(true);
});

test('deepFreeze returns null and primitives as they are', () => {
  expect(deepFreeze(null)).toBe(null);
  expect(deepFreeze(1)).toBe(1);
  expect(deepFreeze('a')).toBe('a');
});

test('deepFreeze leaves a Buffer as it is and freezes the object holding it', () => {
  const value = { body: Buffer.from('hi') };
  deepFreeze(value);
  expect(Object.isFrozen(value)).toBe(true);
  expect(value.body.toString()).toEqual('hi');
});
