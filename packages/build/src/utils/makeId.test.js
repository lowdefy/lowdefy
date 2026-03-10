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
  makeId.setCounter(35);
  expect(makeId.next()).toBe('10');
  expect(makeId.next()).toBe('11');
});

test('reset sets counter back to 0', () => {
  makeId.next();
  makeId.next();
  makeId.reset();
  expect(makeId.next()).toBe('1');
});

test('setCounter advances counter so next ids do not collide with prior ids', () => {
  makeId.next(); // '1'
  makeId.next(); // '2'
  makeId.setCounter(100);
  expect(makeId.next()).toBe('2t');
  expect(makeId.next()).toBe('2u');
});

test('setCounter to 0 is equivalent to reset', () => {
  makeId.next();
  makeId.setCounter(0);
  expect(makeId.next()).toBe('1');
});
