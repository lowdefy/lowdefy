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
import createCheckDuplicateBlockId from '../createCheckDuplicateBlockId.js';

function createPageContext(pageId) {
  const context = { errors: [], keyMap: {} };
  return {
    context,
    pageId,
    blockIdCounter: createCounter(),
    checkDuplicateBlockId: createCheckDuplicateBlockId({ context, pageId }),
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

test('setBlockId collects a page id collision and still builds the block', () => {
  const pageContext = createPageContext('myPage');
  setBlockId({ id: 'myPage' }, pageContext);

  const child = { id: 'myPage' };
  setBlockId(child, pageContext);
  // A block that repeats the page id is both a collision and a duplicate, and
  // both are reported in the one build.
  expect(pageContext.context.errors.map((error) => error.message)).toEqual([
    'Block id "myPage" on page "myPage" collides with the page id. A block cannot have the same id as its page.',
    'Duplicate blockId "myPage" on page "myPage". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.',
  ]);
  expect(child.id).toBe('block:myPage:myPage:1');
});

test('setBlockId throws a page id collision when the context collects no errors', () => {
  const blockIdCounter = createCounter();
  const context = {};
  const page = { id: 'myPage' };
  setBlockId(page, { context, pageId: 'myPage', blockIdCounter });

  const child = { id: 'myPage' };
  expect(() => setBlockId(child, { context, pageId: 'myPage', blockIdCounter })).toThrow(
    'Block id "myPage" on page "myPage" collides with the page id. A block cannot have the same id as its page.'
  );
});

test('setBlockId collects a page id collision on a deeply nested block', () => {
  const pageContext = createPageContext('box');
  setBlockId({ id: 'box' }, pageContext);
  setBlockId({ id: 'container' }, pageContext);
  setBlockId({ id: 'wrapper' }, pageContext);

  setBlockId({ id: 'box' }, pageContext);
  expect(pageContext.context.errors[0].message).toBe(
    'Block id "box" on page "box" collides with the page id. A block cannot have the same id as its page.'
  );
});

test('setBlockId collects a duplicate id and still gives the block a unique id', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);

  const duplicate = { id: 'email' };
  setBlockId(duplicate, pageContext);
  expect(pageContext.context.errors).toHaveLength(1);
  expect(pageContext.context.errors[0].message).toBe(
    'Duplicate blockId "email" on page "page1". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.'
  );
  expect(duplicate.id).toBe('block:page1:email:1');
});

test('setBlockId reports a nested slot block that repeats an id used higher on the page', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);
  setBlockId({ id: 'container' }, pageContext);

  setBlockId({ id: 'email' }, pageContext);
  expect(pageContext.context.errors[0].message).toContain(
    'Duplicate blockId "email" on page "page1".'
  );
});

test('setBlockId reports two block ids that differ only in case', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email' }, pageContext);

  setBlockId({ id: 'Email' }, pageContext);
  expect(pageContext.context.errors[0].message).toContain(
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
  setBlockId(block2, pageContext2);

  expect(pageContext1.context.errors).toEqual([]);
  expect(pageContext2.context.errors).toEqual([]);
  expect(block1.id).toBe('block:page1:email:0');
  expect(block2.id).toBe('block:page2:email:0');
});

test('setBlockId reports the duplicate at the second block config location', () => {
  const pageContext = createPageContext('page1');
  setBlockId({ id: 'page1' }, pageContext);
  setBlockId({ id: 'email', '~k': 'first' }, pageContext);

  setBlockId({ id: 'email', '~k': 'second' }, pageContext);
  const [error] = pageContext.context.errors;
  expect(error.name).toBe('ConfigError');
  expect(error.configKey).toBe('second');
});
