import testContext from '../testContext';

const client = {
  writeFragment: jest.fn(),
};

// Mock message
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
const message = { loading: () => jest.fn(), error: mockMessageError, success: mockMessageSuccess };

// Mock Notification
const mockNotificationSuccess = jest.fn();
const mockNotificationError = jest.fn();
const notification = {
  loading: () => jest.fn(),
  error: mockNotificationError,
  success: mockNotificationSuccess,
};

const branch = 'master';
const openidLogoutUrl = 'logout';
const pageId = 'one';
const user = { firstName: 'ABC' };

const rootContext = {
  branch,
  client,
  // appGraphql,
  message,
  notification,
  openidLogoutUrl,
  user,
};

test('Notification with message', async () => {
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
                  type: 'Notification',
                  params: { message: 'test' },
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
  expect(mockNotificationError.mock.calls).toEqual([]);
  expect(mockNotificationSuccess.mock.calls).toEqual([
    [
      {
        bottom: undefined,
        description: '',
        duration: 5,
        message: 'test',
        placement: undefined,
        top: undefined,
      },
    ],
  ]);
});

test('Notification with status error and message', async () => {
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
                  type: 'Notification',
                  params: { message: 'err', status: 'error' },
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
  expect(mockNotificationSuccess.mock.calls).toEqual([]);
  expect(mockNotificationError.mock.calls).toEqual([
    [
      {
        bottom: undefined,
        description: '',
        duration: 5,
        message: 'err',
        placement: undefined,
        top: undefined,
      },
    ],
  ]);
});

test('Notification with no params', async () => {
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
                  type: 'Notification',
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
  expect(mockNotificationError.mock.calls).toEqual([]);
  expect(mockNotificationSuccess.mock.calls).toEqual([
    [
      {
        bottom: undefined,
        description: '',
        duration: 5,
        message: 'Success',
        placement: undefined,
        top: undefined,
      },
    ],
  ]);
});
