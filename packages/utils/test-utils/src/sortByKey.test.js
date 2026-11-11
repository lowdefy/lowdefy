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

import sortByKey from './sortByKey.js';

test('sortByKey orders entries by their keys and keeps each value with its key', () => {
  expect(
    sortByKey([
      ['member', 2],
      ['auditor', 1],
      ['none', 3],
    ])
  ).toEqual([
    ['auditor', 1],
    ['member', 2],
    ['none', 3],
  ]);
});

test('sortByKey orders by code unit, not by locale or number', () => {
  const keys = ['page_9', 'home', 'Zebra', 'page_10', '404', 'account-kit/login', 'éclair'];
  expect(sortByKey(keys.map((key) => [key, null])).map(([key]) => key)).toEqual([
    '404',
    'Zebra',
    'account-kit/login',
    'home',
    'page_10',
    'page_9',
    'éclair',
  ]);
});

test('sortByKey returns a new array and leaves the entries it was given in place', () => {
  const entries = [
    ['b', 1],
    ['a', 2],
  ];
  const sorted = sortByKey(entries);
  expect(sorted).not.toBe(entries);
  expect(entries).toEqual([
    ['b', 1],
    ['a', 2],
  ]);
});

test('sortByKey keeps entries with the same key in the order given', () => {
  expect(
    sortByKey([
      ['a', 'first'],
      ['b', 'only'],
      ['a', 'second'],
    ])
  ).toEqual([
    ['a', 'first'],
    ['a', 'second'],
    ['b', 'only'],
  ]);
});
