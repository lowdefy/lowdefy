/*
  Copyright 2020 Lowdefy, Inc

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

import getContext from '../src/getContext';

const updateBlock = () => jest.fn();
const displayMessage = { loading: () => jest.fn(), error: jest.fn(), success: jest.fn() };
const pageId = 'pageId';
const client = {};

test('block is required input', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  await expect(getContext({ contextId: 'c1', pageId, rootContext })).rejects.toThrow(
    'A block must be provided to get context.'
  );
});

test('memoize context', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext });
  const c2 = await getContext({ block, contextId: 'c1', pageId, rootContext });
  expect(c1).toBe(c2);
});

test('call update for listening contexts', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block1 = {
    blockId: 'block1',
    meta: {
      type: 'context',
    },
  };
  const block2 = {
    blockId: 'block2',
    meta: {
      type: 'context',
    },
  };
  const mockUpdate = jest.fn();
  const c1 = await getContext({ block: block1, contextId: 'c1', pageId, rootContext });
  const c2 = await getContext({ block: block2, contextId: 'c2', pageId, rootContext });
  c2.update = mockUpdate;
  c1.updateListeners.add('c2');
  c1.update();
  expect(mockUpdate.mock.calls.length).toBe(1);
});

test('remove contextId from updateListeners if not found', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext });

  c1.updateListeners.add('c2');
  expect(c1.updateListeners).toEqual(new Set(['c2']));
  c1.update();
  expect(c1.updateListeners).toEqual(new Set());
});

test('remove contextId from updateListeners if equal to own contextId', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext });

  c1.updateListeners.add('c1');
  expect(c1.updateListeners).toEqual(new Set(['c1']));
  c1.update();
  expect(c1.updateListeners).toEqual(new Set());
});

test('update memoized context', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const mockUpdate = jest.fn();
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext });
  c1.update = mockUpdate;
  await getContext({ block, contextId: 'c1', pageId, rootContext });
  expect(mockUpdate.mock.calls.length).toBe(1);
});

test('call update for nested contexts and prevent circular loop structure', async () => {
  const rootContext = {
    client,
    contexts: {},
    displayMessage,
    input: {},
    updateBlock,
  };
  const block2 = {
    blockId: 'block2',
    meta: {
      type: 'context',
    },
  };
  const block1 = {
    blockId: 'block1',
    meta: {
      type: 'context',
    },
    areas: {
      content: {
        blocks: block2,
      },
    },
  };
  const c1 = await getContext({ block: block1, contextId: 'c1', pageId, rootContext });
  const getC2 = () =>
    getContext({
      block: c1.RootBlocks.areas.root.blocks[0],
      contextId: 'c2',
      pageId,
      rootContext,
    });
  await expect(getC2()).resolves.not.toThrow();
});
