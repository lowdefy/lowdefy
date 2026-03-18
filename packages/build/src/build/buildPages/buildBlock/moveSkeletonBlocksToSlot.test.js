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

import moveSkeletonBlocksToSlot from './moveSkeletonBlocksToSlot.js';

function createPageContext() {
  return { pageId: 'page1', context: {} };
}

test('moveSkeletonBlocksToSlot does nothing when block has no skeleton', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1' };
  moveSkeletonBlocksToSlot(block, pageContext);
  expect(block.skeleton).toBeUndefined();
});

test('moveSkeletonBlocksToSlot does nothing when skeleton is not an object', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', skeleton: 'not-an-object' };
  moveSkeletonBlocksToSlot(block, pageContext);
  expect(block.skeleton).toBe('not-an-object');
});

test('moveSkeletonBlocksToSlot moves skeleton blocks to slots.content.blocks', () => {
  const pageContext = createPageContext();
  const children = [{ id: 's1' }, { id: 's2' }];
  const block = { blockId: 'b1', skeleton: { blocks: children } };
  moveSkeletonBlocksToSlot(block, pageContext);
  expect(block.skeleton.slots.content.blocks).toBe(children);
  expect(block.skeleton.blocks).toBeUndefined();
});

test('moveSkeletonBlocksToSlot handles nested skeleton slots recursively', () => {
  const pageContext = createPageContext();
  const block = {
    blockId: 'b1',
    skeleton: {
      slots: {
        content: {
          blocks: [
            {
              blocks: [{ id: 'deep' }],
            },
          ],
        },
      },
    },
  };
  moveSkeletonBlocksToSlot(block, pageContext);
  expect(block.skeleton.slots.content.blocks[0].slots.content.blocks).toEqual([{ id: 'deep' }]);
  expect(block.skeleton.slots.content.blocks[0].blocks).toBeUndefined();
});

test('moveSkeletonBlocksToSlot throws when skeleton blocks is not an array', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', skeleton: { blocks: 'invalid' } };
  expect(() => moveSkeletonBlocksToSlot(block, pageContext)).toThrow('is not an array');
});

test('moveSkeletonBlocksToSlot does nothing when skeleton has no blocks', () => {
  const pageContext = createPageContext();
  const block = { blockId: 'b1', skeleton: { type: 'Spin' } };
  moveSkeletonBlocksToSlot(block, pageContext);
  expect(block.skeleton).toEqual({ type: 'Spin' });
});
