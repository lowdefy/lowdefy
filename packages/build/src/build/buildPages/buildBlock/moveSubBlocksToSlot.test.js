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

import moveSubBlocksToSlot from './moveSubBlocksToSlot.js';

function createPageContext() {
  return { pageId: 'page1', context: {} };
}

test('moveSubBlocksToSlot does nothing when block has no blocks', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1' };
  moveSubBlocksToSlot(block, pageContext);
  expect(block.slots).toBeUndefined();
});

test('moveSubBlocksToSlot moves blocks to slots.content.blocks', () => {
  const pageContext = createPageContext();
  const children = [{ id: 'c1' }, { id: 'c2' }];
  const block = { blockId: 'b1', blocks: children };
  moveSubBlocksToSlot(block, pageContext);
  expect(block.slots.content.blocks).toBe(children);
  expect(block.blocks).toBeUndefined();
});

test('moveSubBlocksToSlot throws when blocks is not an array', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', blocks: 'not-an-array' };
  expect(() => moveSubBlocksToSlot(block, pageContext)).toThrow('is not an array');
});

test('moveSubBlocksToSlot handles empty array', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', blocks: [] };
  moveSubBlocksToSlot(block, pageContext);
  expect(block.slots.content.blocks).toEqual([]);
  expect(block.blocks).toBeUndefined();
});
