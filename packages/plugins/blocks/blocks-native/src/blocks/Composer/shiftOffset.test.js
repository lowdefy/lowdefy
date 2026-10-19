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

import shiftOffset from './shiftOffset.js';

test('shiftOffset moves an offset after an edit by the change in length', () => {
  const edits = [{ start: 0, end: 8, length: 11 }];
  expect(shiftOffset({ offset: 20, edits })).toBe(23);
  expect(shiftOffset({ offset: 8, edits })).toBe(11);
});

test('shiftOffset leaves an offset before every edit', () => {
  expect(shiftOffset({ offset: 3, edits: [{ start: 5, end: 9, length: 2 }] })).toBe(3);
  expect(shiftOffset({ offset: 5, edits: [{ start: 5, end: 9, length: 2 }] })).toBe(5);
});

test('shiftOffset puts an offset inside an edit at the end of what was put in', () => {
  const edits = [
    { start: 0, end: 4, length: 6 },
    { start: 10, end: 18, length: 11 },
  ];
  expect(shiftOffset({ offset: 12, edits })).toBe(23);
  expect(shiftOffset({ offset: 30, edits })).toBe(35);
});
