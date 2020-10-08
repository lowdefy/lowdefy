import testContext from '../testContext';

const branch = 'master';
const pageId = 'one';
const client = { writeFragment: jest.fn() };

const rootContext = {
  branch,
  client,
};

test('do not make subblocks for child contexts', () => {
  const rootBlock = {
    blockId: 'root',
    type: 'Context',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'childContext',
            type: 'Context',
            meta: {
              category: 'context',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'text',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { root, childContext, text } = context.RootBlocks.map;
  expect(context.RootBlocks.subBlocks[root.id][0].subBlocks).toEqual({});
  expect(childContext).toBeDefined();
  expect(text).toBe(undefined);
});
