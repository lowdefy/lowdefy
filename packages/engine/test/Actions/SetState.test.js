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
  // appGraphql,
  message,
  openidLogoutUrl,
  user,
};

test('SetState data to state', () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { x: [1, 2, 3] } }],
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
  const { button } = context.RootBlocks.map;
  expect(context.state).toEqual({ textInput: 'init' });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ textInput: 'init', x: [1, 2, 3] });
});

test('SetState field to state and update block value', () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { textInput: 'new' } }],
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

  expect(context.state).toEqual({ textInput: 'init' });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ textInput: 'new' });
  expect(textInput.value).toEqual('new');
});

test('SetState field to state with incorrect type - NOTE SetState IS NOT TYPE SAFE', () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { textInput: 1 } }],
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

  expect(context.state).toEqual({ textInput: 'init' });
  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({ textInput: 1 });
  expect(textInput.value).toEqual(1);
});

test('SetState value on array and create new Blocks for array items', () => {
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
              onClick: [
                {
                  id: 'a',
                  type: 'SetState',
                  params: { list: [{ textInput: '0' }, { textInput: '1' }, { textInput: '2' }] },
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
    initState: { list: [{ textInput: 'init' }] },
  });
  const { button } = context.RootBlocks.map;

  expect(context.state).toEqual({ list: [{ textInput: 'init' }] });

  button.callAction({ action: 'onClick' });
  expect(context.state).toEqual({
    list: [{ textInput: '0' }, { textInput: '1' }, { textInput: '2' }],
  });

  const textInput0 = context.RootBlocks.map['list.0.textInput'];
  const textInput1 = context.RootBlocks.map['list.1.textInput'];
  const textInput2 = context.RootBlocks.map['list.2.textInput'];

  expect(textInput0.value).toEqual('0');
  expect(textInput1.value).toEqual('1');
  expect(textInput2.value).toEqual('2');
});
