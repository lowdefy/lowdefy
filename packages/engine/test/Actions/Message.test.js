import testContext from '../testContext';

const client = {
  writeFragment: jest.fn(),
};

// Mock message
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
const message = { loading: () => jest.fn(), error: mockMessageError, success: mockMessageSuccess };

const openidLogoutUrl = 'logout';
const pageId = 'one';
const user = { firstName: 'ABC' };

const rootContext = {
  client,
  // appGraphql,
  message,
  document,
  openidLogoutUrl,
  user,
};

test('Message with content', async () => {
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
                  type: 'Message',
                  params: { content: 'test' },
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
  });
  const { button } = context.RootBlocks.map;
  button.callAction({ action: 'onClick' });
  expect(mockMessageError.mock.calls).toEqual([]);
  expect(mockMessageSuccess.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'test',
      },
    ],
  ]);
});

test('Message with status error and content', async () => {
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
                  type: 'Message',
                  params: { content: 'err', status: 'error' },
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
  });
  const { button } = context.RootBlocks.map;
  button.callAction({ action: 'onClick' });
  expect(mockMessageSuccess.mock.calls).toEqual([]);
  expect(mockMessageError.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'err',
      },
    ],
  ]);
});

test('Message with no params', async () => {
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
                  type: 'Message',
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
  });
  const { button } = context.RootBlocks.map;
  button.callAction({ action: 'onClick' });
  expect(mockMessageError.mock.calls).toEqual([]);
  expect(mockMessageSuccess.mock.calls).toEqual([
    [
      {
        duration: 5,
        content: 'Success',
      },
    ],
  ]);
});
