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

import freezeColumns from './freezeColumns.js';
import pinColumn from './pinColumn.js';

test('pinColumn pins to the inner edge of a region and moves between regions', () => {
  const pinning = { start: ['a'], end: ['z'] };
  expect(pinColumn({ pinning, key: 'b', side: 'start' })).toEqual({
    start: ['a', 'b'],
    end: ['z'],
  });
  expect(pinColumn({ pinning, key: 'b', side: 'end' })).toEqual({ start: ['a'], end: ['b', 'z'] });
  expect(pinColumn({ pinning, key: 'a', side: 'end' })).toEqual({ start: [], end: ['a', 'z'] });
  expect(pinColumn({ pinning, key: 'z', side: null })).toEqual({ start: ['a'], end: [] });
});

test('freezeColumns pins the column and every visible column before it', () => {
  const visibleOrder = ['a', 'b', 'c', 'd', 'z'];
  expect(freezeColumns({ pinning: { start: [], end: ['z'] }, visibleOrder, key: 'c' })).toEqual({
    start: ['a', 'b', 'c'],
    end: ['z'],
  });
  expect(
    freezeColumns({ pinning: { start: ['a', 'b', 'c'], end: [] }, visibleOrder, key: 'a' })
  ).toEqual({ start: ['a'], end: [] });
});

test('freezeColumns keeps hidden start-pinned columns and unpins frozen end columns', () => {
  expect(
    freezeColumns({
      pinning: { start: ['hidden'], end: ['z'] },
      visibleOrder: ['a', 'z'],
      key: 'z',
    })
  ).toEqual({ start: ['hidden', 'a', 'z'], end: [] });
});
