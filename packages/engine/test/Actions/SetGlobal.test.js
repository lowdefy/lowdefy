import testContext from '../testContext';

const client = {
  writeFragment: jest.fn(),
};

// Mock message
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
const message = { loading: () => jest.fn(), error: mockMessageError, success: mockMessageSuccess };

const branch = 'master';
const openidLogoutUrl = 'logout';
const pageId = 'one';
const user = { firstName: 'ABC' };

const rootContext = {
  branch,
  client,
  message,
  document,
  openidLogoutUrl,
  user,
  window,
};

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
