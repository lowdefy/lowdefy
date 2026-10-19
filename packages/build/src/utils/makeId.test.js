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

import makeId from './makeId.js';

beforeEach(() => {
  makeId.reset();
});

test('next returns sequential base-36 ids starting from 1', () => {
  expect(makeId.next()).toBe('1');
  expect(makeId.next()).toBe('2');
  expect(makeId.next()).toBe('3');
});

test('next returns base-36 ids for larger numbers', () => {
  makeId.continueFrom({ prefix: '', counter: 35 });
  expect(makeId.next()).toBe('10');
  expect(makeId.next()).toBe('11');
});

test('reset sets counter back to 0', () => {
  makeId.next();
  makeId.next();
  makeId.reset();
  expect(makeId.next()).toBe('1');
});

test('reset with a prefix starts every id with it, and a plain reset drops it', () => {
  makeId.reset({ prefix: 'a1b2_' });
  expect(makeId.next()).toBe('a1b2_1');
  expect(makeId.next()).toBe('a1b2_2');
  makeId.reset();
  expect(makeId.next()).toBe('1');
});

test('continueFrom takes the prefix and counter of a new config build', () => {
  makeId.reset({ prefix: 'a1b2_' });
  makeId.continueFrom({ prefix: 'c3d4_', counter: 100 });
  expect(makeId.next()).toBe('c3d4_2t');
});

test('continueFrom never moves the counter back within one config build', () => {
  makeId.continueFrom({ prefix: 'a1b2_', counter: 100 });
  makeId.next(); // 'a1b2_2t', a key of an earlier page build
  makeId.continueFrom({ prefix: 'a1b2_', counter: 100 });
  expect(makeId.next()).toBe('a1b2_2u');
});
