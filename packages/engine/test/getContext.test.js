import getContext from '../src/getContext';

const message = { loading: () => jest.fn(), error: jest.fn(), success: jest.fn() };
const pageId = 'pageId';
const client = {
  writeFragment: jest.fn(),
};

test('block is required input', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
  };
  await expect(getContext({ contextId: 'c1', pageId, rootContext, message })).rejects.toThrow(
    'A block must be provided to get context.'
  );
});

test('memoize context', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext, message });
  const c2 = await getContext({ block, contextId: 'c1', pageId, rootContext, message });
  expect(c1).toBe(c2);
});

test('call update for listening contexts', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
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
  const c1 = await getContext({ block: block1, contextId: 'c1', pageId, rootContext, message });
  const c2 = await getContext({ block: block2, contextId: 'c2', pageId, rootContext, message });
  c2.update = mockUpdate;
  c1.updateListeners.add('c2');
  c1.update();
  expect(mockUpdate.mock.calls.length).toBe(1);
});

test('remove contextId from updateListeners if not found', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext, message });

  c1.updateListeners.add('c2');
  expect(c1.updateListeners).toEqual(new Set(['c2']));
  c1.update();
  expect(c1.updateListeners).toEqual(new Set());
});

test('remove contextId from updateListeners if equal to own contextId', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext, message });

  c1.updateListeners.add('c1');
  expect(c1.updateListeners).toEqual(new Set(['c1']));
  c1.update();
  expect(c1.updateListeners).toEqual(new Set());
});

test('update memoized context', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
  };
  const block = {
    blockId: 'blockId',
    meta: {
      type: 'context',
    },
  };
  const mockUpdate = jest.fn();
  const c1 = await getContext({ block, contextId: 'c1', pageId, rootContext, message });
  c1.update = mockUpdate;
  await getContext({ block, contextId: 'c1', pageId, rootContext, message });
  expect(mockUpdate.mock.calls.length).toBe(1);
});

test('call update for nested contexts and prevent circular loop structure', async () => {
  const rootContext = {
    contexts: {},
    input: {},
    client,
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
  const c1 = await getContext({ block: block1, contextId: 'c1', pageId, rootContext, message });
  const getC2 = () =>
    getContext({
      block: c1.RootBlocks.areas.root.blocks[0],
      contextId: 'c2',
      pageId,
      rootContext,
      message,
    });
  await expect(getC2()).resolves.not.toThrow();
});
