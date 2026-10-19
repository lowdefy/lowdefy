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

import { ReservedKeyError } from '@lowdefy/helpers';

import createFieldAccessor from './createFieldAccessor.js';

test('createFieldAccessor reads a top-level and a nested field', () => {
  expect(createFieldAccessor('name')({ name: 'Ada' })).toBe('Ada');
  expect(createFieldAccessor('owner.name')({ owner: { name: 'Ada' } })).toBe('Ada');
  expect(createFieldAccessor('tags.1')({ tags: ['a', 'b'] })).toBe('b');
});

test('createFieldAccessor returns undefined for a missing field or a non-object on the way', () => {
  expect(createFieldAccessor('owner.name')({})).toBeUndefined();
  expect(createFieldAccessor('owner.name')({ owner: 'Ada' })).toBeUndefined();
  expect(createFieldAccessor('owner.name')({ owner: null })).toBeUndefined();
});

test('createFieldAccessor reads literal dotted keys and escaped dots like get', () => {
  expect(createFieldAccessor('a.b')({ 'a.b': 1 })).toBe(1);
  expect(createFieldAccessor('a\\.b')({ 'a.b': 2 })).toBe(2);
});

test('createFieldAccessor does not read inherited methods', () => {
  expect(createFieldAccessor('toString')({})).toBeUndefined();
  expect(createFieldAccessor('items.map')({ items: [] })).toBeUndefined();
  expect(createFieldAccessor('toString')({ toString: 'own' })).toBe('own');
});

test('createFieldAccessor rejects reserved path segments like get', () => {
  const read = createFieldAccessor('constructor');
  expect(() => read({ constructor: 1 })).toThrow(ReservedKeyError);
});
