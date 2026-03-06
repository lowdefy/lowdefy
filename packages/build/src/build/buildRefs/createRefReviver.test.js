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

import { serializer } from '@lowdefy/helpers';
import createRefReviver from './createRefReviver.js';

test('createRefReviver sets ~r on objects without it', () => {
  const reviver = createRefReviver('ref-1');
  const input = { a: { b: 1 }, c: [{ d: 2 }] };
  const result = serializer.copy(input, { reviver });
  expect(result['~r']).toBe('ref-1');
  expect(result.a['~r']).toBe('ref-1');
  expect(result.c[0]['~r']).toBe('ref-1');
});

test('createRefReviver preserves existing ~r values', () => {
  const reviver = createRefReviver('ref-new');
  const inner = { x: 1 };
  Object.defineProperty(inner, '~r', {
    value: 'ref-original',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  // serializer.copy with reviver - the reviver sees the copied object
  // Since serializer.copy doesn't preserve non-enumerable props by default,
  // the copied inner won't have ~r, so the reviver will set it.
  // This test verifies the reviver skips objects that already have ~r.
  const obj = { val: 1 };
  Object.defineProperty(obj, '~r', {
    value: 'ref-existing',
    enumerable: true,
    writable: true,
    configurable: true,
  });
  const result = reviver('key', obj);
  expect(result['~r']).toBe('ref-existing');
});

test('createRefReviver passes through non-object values', () => {
  const reviver = createRefReviver('ref-1');
  expect(reviver('key', 42)).toBe(42);
  expect(reviver('key', 'hello')).toBe('hello');
  expect(reviver('key', null)).toBe(null);
  expect(reviver('key', true)).toBe(true);
});

test('createRefReviver sets ~r as non-enumerable', () => {
  const reviver = createRefReviver('ref-1');
  const obj = { a: 1 };
  reviver('key', obj);
  expect(obj['~r']).toBe('ref-1');
  expect(Object.keys(obj)).toEqual(['a']);
});
