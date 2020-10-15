import testContext from '../testContext';

const pageId = 'one';

const rootContext = {};

test('SetGlobal data to global', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'SetGlobal',
                  params: { str: 'hello', number: 13, arr: [1, 2, 3], x: 'new' },
                },
              ],
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
    initLowdefyGlobal: { x: 'old', init: 'init' },
  });

  expect(context.lowdefyGlobal).toEqual({ x: 'old', init: 'init' });
  const { button } = context.RootBlocks.map;

  await button.callAction({ action: 'onClick' });
  expect(context.lowdefyGlobal).toEqual({
    init: 'init',
    str: 'hello',
    number: 13,
    arr: [1, 2, 3],
    x: 'new',
  });
});
