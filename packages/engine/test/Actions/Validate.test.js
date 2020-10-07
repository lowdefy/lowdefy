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
  openidLogoutUrl,
  user,
};

test('Validate', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'text1',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '12', key: 'text1' } },
                message: 'text1 does not match pattern 12',
              },
            ],
          },
          {
            blockId: 'text2',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '123', key: 'text1' } },
                message: 'text1 does not match pattern 123',
              },
            ],
          },
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            actions: {
              onClick: [
                {
                  id: 'action1',
                  type: 'Validate',
                  params: 'text1',
                  error: 'Error validating text1',
                  success: 'Success validating text1',
                },
                {
                  id: 'action2',
                  type: 'Validate',
                  params: 'text2',
                  error: 'Error validating text2',
                  success: 'Success validating text2',
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
    initState: { a: 'init' },
  });
  const { button, text1 } = context.RootBlocks.map;
  expect(text1.validateEval.output).toEqual([]);
  context.showValidationErrors = true;
  context.update();
  expect(text1.validateEval.output).toEqual([
    {
      message: 'text1 does not match pattern 12',
      pass: false,
    },
  ]);
  await button.callAction({ action: 'onClick' });
  expect(button.BlockActions.actions.onClick.calls[0].error).toEqual([
    {
      args: undefined,
      error: null,
      errorMessage: 'Error validating text1',
      id: 'action1',
      params: 'text1',
      skipped: false,
      type: 'Validate',
    },
  ]);
  text1.setValue('12');
  await button.callAction({ action: 'onClick' });
  expect(button.BlockActions.actions.onClick.calls[0].error).toEqual([
    {
      args: undefined,
      error: null,
      errorMessage: 'Error validating text2',
      id: 'action2',
      params: 'text2',
      skipped: false,
      type: 'Validate',
    },
    {
      args: undefined,
      error: null,
      id: 'action1',
      params: 'text1',
      skipped: false,
      successMessage: 'Success validating text1',
      type: 'Validate',
    },
  ]);
  text1.setValue('123');
  await button.callAction({ action: 'onClick' });
  expect(button.BlockActions.actions.onClick.calls[0].success).toEqual([
    'Success validating text2',
    'Success validating text1',
  ]);
  text1.setValue('');
  await button.callAction({ action: 'onClick' });
  expect(button.BlockActions.actions.onClick.calls[0].error).toEqual([
    {
      args: undefined,
      error: null,
      errorMessage: 'Error validating text1',
      id: 'action1',
      params: 'text1',
      skipped: false,
      type: 'Validate',
    },
  ]);
});
