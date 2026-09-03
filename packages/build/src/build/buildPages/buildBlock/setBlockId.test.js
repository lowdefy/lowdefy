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
import createCheckDuplicateId from '../../../utils/createCheckDuplicateId.js';

function createPageContext(pageId) {
  return {
    pageId,
    blockIdCounter: createCounter(),
    checkDuplicateBlockId: createCheckDuplicateId({
      message:
        'Duplicate blockId "{{ id }}" on page "{{ pageId }}". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.',
    }),
  };
}

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

test('setBlockId does not check duplicates when no checkDuplicateBlockId is supplied', () => {
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

test('setBlockId throws when two sibling blocks share an id', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);

  expect(() => setBlockId({ id: 'email' }, pageContext)).toThrow(
    'Duplicate blockId "email" on page "page1". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.'
  );
});

test('setBlockId throws when a nested slot block repeats an id used higher on the page', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);
  setBlockId({ id: 'container' }, pageContext);

  expect(() => setBlockId({ id: 'email' }, pageContext)).toThrow(
    'Duplicate blockId "email" on page "page1".'
  );
});

test('setBlockId throws when two block ids differ only in case', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);

  expect(() => setBlockId({ id: 'Email' }, pageContext)).toThrow(
    'Duplicate blockId "Email" on page "page1".'
  );
});

test('setBlockId allows the same block id on two different pages', () => {
  const pageContext1 = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext1);
  const block1 = { id: 'email' };
  setBlockId(block1, pageContext1);

  const pageContext2 = createPageContext('page2');
  setBlockId({ id: 'page2' }, pageContext2);
  const block2 = { id: 'email' };
  expect(() => setBlockId(block2, pageContext2)).not.toThrow();

  expect(block1.id).toBe('block:page1:email:0');
  expect(block2.id).toBe('block:page2:email:0');
});

test('setBlockId reports the duplicate at the second block config location', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email', '~k': 'first' }, pageContext);

  expect.assertions(2);
  try {
    setBlockId({ id: 'email', '~k': 'second' }, pageContext);
  } catch (error) {
    expect(error.name).toBe('ConfigError');
    expect(error.configKey).toBe('second');
  }
});
