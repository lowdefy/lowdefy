/* eslint-disable prefer-promise-reject-errors */
import testContext from './testContext';

const pageId = 'one';

const mockLoadingCallback = jest.fn();
const mockLoading = jest.fn(() => mockLoadingCallback);
const mockSuccess = jest.fn();
const mockError = jest.fn();

const displayMessage = {
  loading: mockLoading,
  error: mockError,
  success: mockSuccess,
};

const mockMutateImp = ({ mutationId }) => {
  return new Promise((resolve, reject) => {
    if (mutationId === 'req_error') {
      reject({ errorMessage: 'Error!' });
    }
    resolve({ successMessage: 'Done!' });
  });
};
const mockMutate = jest.fn();

const client = {
  mutate: mockMutate,
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

const rootContext = {
  client,
  displayMessage,
};

beforeEach(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  mockLoadingCallback.mockReset();
  mockLoading.mockReset();
  mockLoading.mockImplementation(() => mockLoadingCallback);
  mockSuccess.mockReset();
  mockError.mockReset();
  mockMutate.mockReset();
  mockMutate.mockImplementation(mockMutateImp);
});

test('init BlockActions', () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
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
  const { button } = context.RootBlocks.map;
  expect(button.BlockActions.actions).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actionName": "onClick",
        "call": [Function],
        "calls": Array [],
        "loading": false,
      },
    }
  `);
});

test('callAction no Action defined', async () => {
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
  const { button } = context.RootBlocks.map;
  const promise = button.callAction({ action: 'onClick' });
  expect(button.BlockActions.actions).toEqual({});
  const res = await promise;
  expect(res).toBe(undefined);
});

test('callAction x1', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
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
  const { button } = context.RootBlocks.map;
  const promise = button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(button.BlockActions.actions).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actionName": "onClick",
        "call": [Function],
        "calls": Array [],
        "loading": true,
      },
    }
  `);
  await promise;
  expect(button.BlockActions.actions.onClick.calls[0].args).toEqual({ x: 1 });
  expect(button.BlockActions.actions.onClick.calls[0].success.length).toEqual(1);
  expect(button.BlockActions.actions.onClick.loading).toEqual(false);
});

test('callAction x2', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    mutations: [{ mutationId: 'mut1' }],
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
                { id: 'a', type: 'SetState', params: { a: 'a' } },
                { id: 'b', type: 'Mutate', params: 'mut1' },
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(button.BlockActions.actions.onClick.calls[0].args).toEqual({ x: 1 });
  expect(button.BlockActions.actions.onClick.calls[0].success.length).toEqual(2);
  expect(button.BlockActions.actions.onClick.loading).toEqual(false);
});

test('callAction error', async () => {
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
                  id: 'e',
                  type: 'error()',
                  params: { a: 'a' },
                  error: 'error invalid action type',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(button.BlockActions.actions.onClick.calls[0].error.length).toEqual(1);
  expect(button.BlockActions.actions.onClick.loading).toEqual(false);
  expect(button.BlockActions.actions.onClick.calls[0].error).toMatchInlineSnapshot(`
    Array [
      Object {
        "args": Object {
          "x": 1,
        },
        "error": Object {
          "error": [Error: Invalid action: {"id":"e","type":"error()","params":{"a":"a"},"error":"error invalid action type"}],
          "message": "Invalid action: {\\"id\\":\\"e\\",\\"type\\":\\"error()\\",\\"params\\":{\\"a\\":\\"a\\"},\\"error\\":\\"error invalid action type\\"}",
          "name": "Error",
        },
        "errorMessage": "error invalid action type",
        "id": "e",
        "params": Object {
          "a": "a",
        },
        "skipped": false,
        "type": "error()",
      },
    ]
  `);
});

test('messages: loading and success', async () => {
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
                  type: 'SetState',
                  params: { a: 'a' },
                  success: 'successMessage',
                  error: 'errorMessage',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(1);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
  expect(mockSuccess).toHaveBeenCalledTimes(1);
  expect(mockError).toHaveBeenCalledTimes(0);
});

test('messages: success and hideLoading', async () => {
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
                  type: 'SetState',
                  params: { a: 'a' },
                  success: 'successMessage',
                  error: 'errorMessage',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', hideLoading: true, args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(0);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(0);
  expect(mockSuccess).toHaveBeenCalledTimes(1);
  expect(mockError).toHaveBeenCalledTimes(0);
});

test('messages: no success and loading', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' }, error: 'errorMessage' }],
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
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(1);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
  expect(mockSuccess).toHaveBeenCalledTimes(0);
  expect(mockError).toHaveBeenCalledTimes(0);
});

test('messages: error and loading', async () => {
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
                  type: 'SetState',
                  params: { _state: null },
                  success: 'successMessage',
                  error: 'errorMessage',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(1);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
  expect(mockSuccess).toHaveBeenCalledTimes(0);
  expect(mockError).toHaveBeenCalledTimes(1);
});

test('messages: default error and loading', async () => {
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
                  type: 'SetState',
                  params: { _state: null },
                  success: 'successMessage',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(1);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
  expect(mockSuccess).toHaveBeenCalledTimes(0);
  expect(mockError).toHaveBeenCalledTimes(1);
  expect(mockError.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Failed to set state due to parser error.",
        6,
      ],
    ]
  `);
});

test('messages: error and hideLoading', async () => {
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
                  type: 'SetState',
                  params: { _state: null },
                  success: 'successMessage',
                  error: 'errorMessage',
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.callAction({ action: 'onClick', hideLoading: true, args: { x: 1 } });
  expect(mockLoading).toHaveBeenCalledTimes(0);
  expect(mockLoadingCallback).toHaveBeenCalledTimes(0);
  expect(mockSuccess).toHaveBeenCalledTimes(0);
  expect(mockError).toHaveBeenCalledTimes(1);
});

test('registerAction then callAction x1', async () => {
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
  const { button } = context.RootBlocks.map;
  button.BlockActions.registerAction('onClick', [
    { id: 'a', type: 'SetState', params: { a: 'a' } },
  ]);
  expect(button.BlockActions.actions.onClick).toMatchInlineSnapshot(`
    Object {
      "actionName": "onClick",
      "call": [Function],
      "calls": Array [],
      "loading": false,
    }
  `);
  const promise = button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(button.BlockActions.actions.onClick.actionName).toEqual('onClick');
  expect(button.BlockActions.actions.onClick.call).toBeInstanceOf(Function);
  expect(button.BlockActions.actions.onClick.loading).toEqual(true);
  await promise;
  expect(button.BlockActions.actions.onClick.calls[0].args).toEqual({ x: 1 });
  expect(button.BlockActions.actions.onClick.calls[0].success.length).toEqual(1);
  expect(button.BlockActions.actions.onClick.loading).toEqual(false);
});

test('callAction skip', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' }, skip: true }],
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
  const { button } = context.RootBlocks.map;
  const promise = button.callAction({ action: 'onClick', args: { x: 1 } });
  expect(button.BlockActions.actions).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actionName": "onClick",
        "call": [Function],
        "calls": Array [],
        "loading": true,
      },
    }
  `);
  await promise;
  expect(button.BlockActions.actions).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actionName": "onClick",
        "call": [Function],
        "calls": Array [
          Object {
            "args": Object {
              "x": 1,
            },
            "success": Array [
              null,
            ],
            "ts": Object {
              "date": 0,
            },
          },
        ],
        "loading": false,
      },
    }
  `);
  expect(context.actionLog).toMatchInlineSnapshot(`
    Array [
      Object {
        "actionName": "onClick",
        "blockId": "button",
        "response": Array [
          Object {
            "actionId": "a",
            "actionType": "SetState",
            "skipped": true,
          },
        ],
        "status": "success",
        "ts": Object {
          "date": 0,
        },
      },
    ]
  `);
});
