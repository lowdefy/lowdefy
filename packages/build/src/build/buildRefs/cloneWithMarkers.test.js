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

import cloneWithMarkers from './cloneWithMarkers.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

test('deep-clones objects and arrays preserving ~r/~l/~k/~arr non-enumerably', () => {
  const inner = { type: 'Box' };
  setNonEnumerableProperty(inner, '~r', 'ref_1');
  setNonEnumerableProperty(inner, '~l', 7);
  const list = [inner];
  setNonEnumerableProperty(list, '~k', 'k_2');
  setNonEnumerableProperty(list, '~arr', 'a_3');
  const value = { blocks: list };

  const clone = cloneWithMarkers(value);

  expect(clone).not.toBe(value);
  expect(clone.blocks).not.toBe(list);
  expect(clone.blocks[0]).not.toBe(inner);
  expect(clone.blocks[0]).toEqual({ type: 'Box' });
  expect(clone.blocks[0]['~r']).toBe('ref_1');
  expect(clone.blocks[0]['~l']).toBe(7);
  expect(clone.blocks['~k']).toBe('k_2');
  expect(clone.blocks['~arr']).toBe('a_3');
  // Markers stay non-enumerable.
  expect(Object.keys(clone.blocks[0])).toEqual(['type']);
});

test('assignRefId stamps ~r only on nodes that have none', () => {
  const tagged = { a: 1 };
  setNonEnumerableProperty(tagged, '~r', 'template_ref');
  const value = { tagged, untagged: { b: 2 } };

  const clone = cloneWithMarkers(value, { assignRefId: 'consumer_ref' });

  expect(clone['~r']).toBe('consumer_ref');
  expect(clone.tagged['~r']).toBe('template_ref');
  expect(clone.untagged['~r']).toBe('consumer_ref');
});

test('without assignRefId, untagged nodes stay untagged', () => {
  const clone = cloneWithMarkers({ a: { b: 1 } });
  expect(clone['~r']).toBeUndefined();
  expect(clone.a['~r']).toBeUndefined();
});

test('non-plain values pass by reference', () => {
  const date = new Date('2026-01-01');
  const clone = cloneWithMarkers({ stamp: date });
  expect(clone.stamp).toBe(date);
});
