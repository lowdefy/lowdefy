/*
  Copyright 2020-2024 Lowdefy, Inc

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
  expect(() => getBlockMatcher(1)).toThrow('Invalid validate params.');
  expect(() => getBlockMatcher(0)).toThrow('Invalid validate params.');
});

test('params is null or undefined', () => {
  let match = getBlockMatcher();
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher(null);
  expect(match('block_id')).toBe(true);
});

test('params is boolean', () => {
  let match = getBlockMatcher(true);
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher(false);
  expect(match('block_id')).toBe(false);
});

test('params is string', () => {
  let match = getBlockMatcher('block_id');
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is array of strings', () => {
  let match = getBlockMatcher(['block_id', 'block_id_one']);
  expect(match('block_id')).toBe(true);
  expect(match('block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

// NOTE: this test case it a contradiction, but needs to be false in order to pass for regex only.
test('params is object with blockIds of null or undefined', () => {
  let match = getBlockMatcher({ blockIds: null });
  expect(match('block_id')).toBe(false);
  match = getBlockMatcher({ blockIds: undefined });
  expect(match('block_id')).toBe(false);
});

test('params is object with blockIds of boolean', () => {
  let match = getBlockMatcher({ blockIds: true });
  expect(match('block_id')).toBe(true);
  match = getBlockMatcher({ blockIds: false });
  expect(match('block_id')).toBe(false);
});

test('params is object with blockIds of string', () => {
  let match = getBlockMatcher({ blockIds: 'block_id' });
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with blockIds of array of string', () => {
  let match = getBlockMatcher({ blockIds: ['block_id', 'block_id_one'] });
  expect(match('block_id')).toBe(true);
  expect(match('block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with regex of string', () => {
  let match = getBlockMatcher({ regex: '^bl' });
  expect(match('block_id')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});

test('params is object with regex of array of string', () => {
  let match = getBlockMatcher({ regex: ['^bl', 'one$'] });
  expect(match('block_id')).toBe(true);
  expect(match('a_block_id_one')).toBe(true);
  expect(match('not_block_id')).toBe(false);
});
