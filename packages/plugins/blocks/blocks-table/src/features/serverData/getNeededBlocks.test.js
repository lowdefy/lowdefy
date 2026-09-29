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

import getNeededBlocks from './getNeededBlocks.js';

test('getNeededBlocks maps a display range to the blocks of one list', () => {
  const segments = [{ itemStart: 0, length: 1000, listKey: '[]', groupPath: [], listStart: 0 }];
  expect(getNeededBlocks({ segments, rowStart: 180, rowEnd: 230, blockSize: 100 })).toEqual([
    { listKey: '[]', groupPath: [], index: 1 },
    { listKey: '[]', groupPath: [], index: 2 },
  ]);
});

test('getNeededBlocks maps items after an expanded group back to their list rows', () => {
  // Groups a (0) and b (1) at the root, a expanded with 3 rows, then b at item 4.
  const segments = [
    { itemStart: 0, length: 1, listKey: '[]', groupPath: [], listStart: 0 },
    { itemStart: 1, length: 3, listKey: '["a"]', groupPath: ['a'], listStart: 0 },
    { itemStart: 4, length: 1, listKey: '[]', groupPath: [], listStart: 1 },
  ];
  expect(getNeededBlocks({ segments, rowStart: 2, rowEnd: 5, blockSize: 2 })).toEqual([
    { listKey: '["a"]', groupPath: ['a'], index: 0 },
    { listKey: '["a"]', groupPath: ['a'], index: 1 },
    { listKey: '[]', groupPath: [], index: 0 },
  ]);
});

test('getNeededBlocks lists each block once', () => {
  const segments = [
    { itemStart: 0, length: 2, listKey: '[]', groupPath: [], listStart: 0 },
    { itemStart: 5, length: 2, listKey: '[]', groupPath: [], listStart: 2 },
  ];
  expect(getNeededBlocks({ segments, rowStart: 0, rowEnd: 10, blockSize: 100 })).toEqual([
    { listKey: '[]', groupPath: [], index: 0 },
  ]);
});
