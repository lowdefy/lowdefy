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

import getBlockMatcher from '../src/getBlockMatcher.js';

test('params is invalid', () => {
  expect(() => getBlockMatcher({ params: 1 })).toThrow('Invalid validate params.');
  expect(() => getBlockMatcher({ params: 0 })).toThrow('Invalid validate params.');
});

test('params is null or undefined', () => {
  let match = getBlockMatcher({});
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher({ params: null });
  expect(match('block_id')).toBe(true);
});

test('params is boolean', () => {
  let match = getBlockMatcher({ params: true });
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher({ params: false });
  expect(match('block_id')).toBe(false);
});

test('params is string', () => {
  let match = getBlockMatcher({ params: 'block_id' });
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is array of strings', () => {
  let match = getBlockMatcher({ params: ['block_id', 'block_id_one'] });
  expect(match('block_id')).toBe(true);
  expect(match('block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

// NOTE: this test case it a contradiction, but needs to be false in order to pass for regex only.
test('params is object with blockIds of null or undefined', () => {
  let match = getBlockMatcher({ params: { blockIds: null } });
  expect(match('block_id')).toBe(false);
  match = getBlockMatcher({ params: { blockIds: undefined } });
  expect(match('block_id')).toBe(false);
});

test('params is object with blockIds of boolean', () => {
  let match = getBlockMatcher({ params: { blockIds: true } });
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher({ params: { blockIds: false } });
  expect(match('block_id')).toBe(false);
});

test('params is object with blockIds of string', () => {
  let match = getBlockMatcher({ params: { blockIds: 'block_id' } });
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with blockIds of array of string', () => {
  let match = getBlockMatcher({ params: { blockIds: ['block_id', 'block_id_one'] } });
  expect(match('block_id')).toBe(true);
  expect(match('block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with regex of string', () => {
  let match = getBlockMatcher({ params: { regex: '^bl' } });
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with regex of array of string', () => {
  let match = getBlockMatcher({ params: { regex: ['^bl', 'one$'] } });
  expect(match('block_id')).toBe(true);
  expect(match('a_block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('blockIds resolve $ from the action array indices', () => {
  let match = getBlockMatcher({ params: 'items_list.$.name', arrayIndices: [1] });
  expect(match('items_list.1.name')).toBe(true);
  expect(match('items_list.0.name')).toBe(false);
  match = getBlockMatcher({
    params: { blockIds: ['items_list.$.name', 'items_list.$.rows.$.qty'] },
    arrayIndices: [2, 0],
  });
  expect(match('items_list.2.name')).toBe(true);
  expect(match('items_list.2.rows.0.qty')).toBe(true);
});

test('blockIds keep $ when the action has no array indices', () => {
  const match = getBlockMatcher({ params: 'items_list.$.name', arrayIndices: [] });
  expect(match('items_list.$.name')).toBe(true);
});
