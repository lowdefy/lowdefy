import testContext from '../testContext';

// Mock apollo client
const mockReqResponses = {
  req_one: {
    data: {
      request: {
        id: 'req_one',
        success: true,
        response: 1,
      },
    },
  },
  req_two: {
    data: {
      request: {
        id: 'req_two',
        success: true,
        response: 2,
      },
    },
  },
};

const mockQuery = jest.fn();
const mockQueryImp = ({ variables }) => {
  const { requestInput } = variables;
  const { requestId } = requestInput;
  return new Promise((resolve, reject) => {
    if (requestId === 'req_error') {
      reject(mockReqResponses[requestId]);
    }
    resolve(mockReqResponses[requestId]);
  });
};

const client = {
  query: mockQuery,
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

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockImplementation(mockQueryImp);
});

test('Reset one field', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            actions: {
              onClick: [{ id: 'a', type: 'Reset' }],
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
    initState: { textInput: 'init' },
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const { button, textInput } = context.RootBlocks.map;

  textInput.setValue('1');
  expect(context.state).toEqual({ textInput: '1' });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init' });
});

test('Reset on primitive array after adding item', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'list',
            type: 'List',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    blockId: 'list.$',
                    type: 'TextInput',
                    defaultValue: '123',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            actions: {
              onClick: [{ id: 'a', type: 'Reset' }],
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
    initState: { list: ['init'] },
  });
  expect(context.state).toEqual({ list: ['init'] });
  const { button, list } = context.RootBlocks.map;

  list.pushItem();
  expect(context.state).toEqual({ list: ['init', '123'] });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ list: ['init'] });
});

test('Reset on object array after removing item', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'list',
            type: 'List',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    blockId: 'list.$.textInput',
                    type: 'TextInput',
                    defaultValue: '123',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            actions: {
              onClick: [{ id: 'a', type: 'Reset' }],
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
    initState: { list: [{ textInput: 'init' }] },
  });

  const { button, list } = context.RootBlocks.map;

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
  list.removeItem(0);
  expect(context.state).toEqual({ list: [] });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });
});

test('Reset with requests on page', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    requests: [
      {
        requestId: 'req_one',
      },
    ],
    areas: {
      content: {
        blocks: [
          {
            blockId: 'textInput',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            actions: {
              onClick: [{ id: 'a', type: 'Reset' }],
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
    initState: { textInput: 'init' },
  });
  expect(context.state).toEqual({ textInput: 'init' });
  const { button, textInput } = context.RootBlocks.map;
  await context.Requests.callRequests();
  expect(context.requests.req_one).toEqual({
    error: [null],
    loading: false,
    response: 1,
  });

  textInput.setValue('1');
  expect(context.state).toEqual({ textInput: '1' });
  await button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init' });
  expect(context.requests.req_one).toEqual({
    error: [null, null],
    loading: false,
    response: 1,
  });
});
