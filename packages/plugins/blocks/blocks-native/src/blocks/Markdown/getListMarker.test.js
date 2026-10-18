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

import getListMarker from './getListMarker.js';

test('getListMarker bullets each level of a nested list differently', () => {
  expect(getListMarker({ depth: 0, number: 1, ordered: false })).toEqual('•');
  expect(getListMarker({ depth: 1, number: 1, ordered: false })).toEqual('◦');
  expect(getListMarker({ depth: 2, number: 1, ordered: false })).toEqual('▪');
  expect(getListMarker({ depth: 5, number: 1, ordered: false })).toEqual('▪');
});

test('getListMarker numbers, then letters, then roman numerals', () => {
  expect(getListMarker({ depth: 0, number: 12, ordered: true })).toEqual('12.');
  expect(getListMarker({ depth: 1, number: 2, ordered: true })).toEqual('b.');
  expect(getListMarker({ depth: 1, number: 28, ordered: true })).toEqual('ab.');
  expect(getListMarker({ depth: 2, number: 4, ordered: true })).toEqual('iv.');
  expect(getListMarker({ depth: 3, number: 9, ordered: true })).toEqual('ix.');
});

test('getListMarker keeps a list started at zero in numbers', () => {
  expect(getListMarker({ depth: 1, number: 0, ordered: true })).toEqual('0.');
});
