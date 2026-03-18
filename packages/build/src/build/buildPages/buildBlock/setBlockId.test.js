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

import setBlockId from './setBlockId.js';
import createCounter from '../../../utils/createCounter.js';

test('page block gets correct blockId and id', () => {
  const block = { id: 'page1' };
  const blockIdCounter = createCounter();
  setBlockId(block, { pageId: 'page1', blockIdCounter });
  expect(block.blockId).toBe('page1');
  expect(block.id).toBe('block:page1:page1:0');
});

test('child block with different id does not throw', () => {
  const blockIdCounter = createCounter();
  const page = { id: 'page1' };
  setBlockId(page, { pageId: 'page1', blockIdCounter });

  const child = { id: 'child1' };
  setBlockId(child, { pageId: 'page1', blockIdCounter });
  expect(child.blockId).toBe('child1');
  expect(child.id).toBe('block:page1:child1:0');
});

test('duplicate child blockIds do not throw', () => {
  const blockIdCounter = createCounter();
  const page = { id: 'page1' };
  setBlockId(page, { pageId: 'page1', blockIdCounter });

  const child1 = { id: 'block' };
  setBlockId(child1, { pageId: 'page1', blockIdCounter });
  expect(child1.id).toBe('block:page1:block:0');

  const child2 = { id: 'block' };
  setBlockId(child2, { pageId: 'page1', blockIdCounter });
  expect(child2.id).toBe('block:page1:block:1');
});

test('child block with same id as page throws ConfigError', () => {
  const blockIdCounter = createCounter();
  const page = { id: 'myPage' };
  setBlockId(page, { pageId: 'myPage', blockIdCounter });

  const child = { id: 'myPage' };
  expect(() => setBlockId(child, { pageId: 'myPage', blockIdCounter })).toThrow(
    'Block id "myPage" on page "myPage" collides with the page id. A block cannot have the same id as its page.'
  );
});

test('deeply nested block with same id as page throws ConfigError', () => {
  const blockIdCounter = createCounter();
  const page = { id: 'box' };
  setBlockId(page, { pageId: 'box', blockIdCounter });

  // Simulate intermediate blocks
  const child1 = { id: 'container' };
  setBlockId(child1, { pageId: 'box', blockIdCounter });

  const child2 = { id: 'wrapper' };
  setBlockId(child2, { pageId: 'box', blockIdCounter });

  // Deeply nested block with same id as page
  const nested = { id: 'box' };
  expect(() => setBlockId(nested, { pageId: 'box', blockIdCounter })).toThrow(
    'Block id "box" on page "box" collides with the page id. A block cannot have the same id as its page.'
  );
});
