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

import parseSelection from './parseSelection.js';

test('parseSelection returns zero-based indices for comma separated numbers', () => {
  expect(parseSelection({ answer: '1,3', count: 3 })).toEqual([0, 2]);
});

test('parseSelection accepts spaces between numbers and sorts and dedupes them', () => {
  expect(parseSelection({ answer: '3, 1 3', count: 3 })).toEqual([0, 2]);
});

test('parseSelection returns null for a number outside the choices', () => {
  expect(parseSelection({ answer: '0', count: 3 })).toBeNull();
  expect(parseSelection({ answer: '1,4', count: 3 })).toBeNull();
});

test('parseSelection returns null for an entry that is not a number', () => {
  expect(parseSelection({ answer: '1,a', count: 3 })).toBeNull();
  expect(parseSelection({ answer: '1.5', count: 3 })).toBeNull();
});

test('parseSelection returns null for an answer with no numbers', () => {
  expect(parseSelection({ answer: ' , ', count: 3 })).toBeNull();
});
