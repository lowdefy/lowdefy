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

import parseRowIndex from './parseRowIndex.js';

test('parseRowIndex reads a zero-based row index', () => {
  expect(parseRowIndex('0')).toBe(0);
  expect(parseRowIndex('12')).toBe(12);
});

test('parseRowIndex gives null for pinned rows and other values', () => {
  expect(parseRowIndex('t-0')).toBeNull();
  expect(parseRowIndex('b-1')).toBeNull();
  expect(parseRowIndex('')).toBeNull();
  expect(parseRowIndex(null)).toBeNull();
  expect(parseRowIndex(undefined)).toBeNull();
  expect(parseRowIndex('1.5')).toBeNull();
});
