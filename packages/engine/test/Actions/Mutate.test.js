import testContext from '../testContext';

// Mock apollo client
const mockMutationResponses = {
  mut_one: {
    data: {
      requestMutation: {
        id: 'mut_one',
        success: true,
        response: 1,
      },
    },
  },
};

const mockMutate = jest.fn();
const mockMutateImp = ({ variables }) => {
  const { requestMutationInput } = variables;
  const { mutationId } = requestMutationInput;
  return new Promise((resolve) => {
    resolve(mockMutationResponses[mutationId]);
  });
};
const client = {
  mutate: mockMutate,
};

const pageId = 'one';

const rootContext = {
  client,
};

beforeEach(() => {
  mockMutate.mockReset();
  mockMutate.mockImplementation(mockMutateImp);
});

test('Mutate', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    mutations: [
      {
        mutationId: 'mut_one',
      },
    ],
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
              onClick: [{ id: 'a', type: 'Mutate', params: 'mut_one' }],
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
  const promise = button.callAction({ action: 'onClick' });
  expect(context.mutations.mut_one).toEqual({
    error: [],
    loading: true,
    response: null,
  });
  await promise;
  expect(context.mutations.mut_one).toEqual({
    error: [null],
    loading: false,
    response: 1,
  });
});
