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

import mergeMonths from './mergeMonths.js';

function entry(month, days, sessions) {
  return { month, days, sessions, persons: 1, orgs: 1, failures: 0 };
}

test('mergeMonths keeps a committed month the cache holds fewer final days of', () => {
  expect(
    mergeMonths({ committed: [entry('2026-09', 30, 400)], counted: [entry('2026-09', 10, 90)] })
  ).toEqual([entry('2026-09', 30, 400)]);
});

test('mergeMonths writes the cache numbers when the cache holds more final days', () => {
  expect(
    mergeMonths({ committed: [entry('2026-10', 2, 20)], counted: [entry('2026-10', 3, 38)] })
  ).toEqual([entry('2026-10', 3, 38)]);
});

test('mergeMonths keeps the committed month when the cache holds as many final days', () => {
  expect(
    mergeMonths({ committed: [entry('2026-09', 30, 400)], counted: [entry('2026-09', 30, 412)] })
  ).toEqual([entry('2026-09', 30, 400)]);
});

test('mergeMonths replaces a month read from as many final days on a recount', () => {
  expect(
    mergeMonths({
      committed: [entry('2026-09', 30, 400)],
      counted: [entry('2026-09', 30, 412)],
      recount: true,
    })
  ).toEqual([entry('2026-09', 30, 412)]);
  expect(
    mergeMonths({
      committed: [entry('2026-09', 30, 400)],
      counted: [entry('2026-09', 10, 90)],
      recount: true,
    })
  ).toEqual([entry('2026-09', 30, 400)]);
});

test('mergeMonths never adds a month to itself and keeps months the cache did not count, oldest first', () => {
  expect(
    mergeMonths({
      committed: [entry('2026-10', 3, 38), entry('2026-08', 31, 380)],
      counted: [entry('2026-10', 3, 38), entry('2026-07', 31, 0)],
    })
  ).toEqual([entry('2026-07', 31, 0), entry('2026-08', 31, 380), entry('2026-10', 3, 38)]);
});
