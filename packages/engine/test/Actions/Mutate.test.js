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
const mockMutate = jest.fn();
const mockMutateImp = ({ variables }) => {
  const { requestMutationInput } = variables;
  const { mutationId } = requestMutationInput;
  return new Promise((resolve) => {
    resolve(mockMutationResponses[mutationId]);
  });
};
const client = {
  query: mockQuery,
  mutate: mockMutate,
  writeFragment: jest.fn(),
};

// Mock document
const mockDocGetElementById = jest.fn();
const mockElemScrollIntoView = jest.fn();
const document = {
  getElementById: mockDocGetElementById,
};
const mockDocGetElementByIdImp = (id) => {
  return { id, scrollIntoView: mockElemScrollIntoView };
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

// Mock window
const mockWindowFocus = jest.fn();
const mockWindowOpen = jest.fn(() => ({ focus: mockWindowFocus }));
const mockWindowScrollTo = jest.fn();
const window = {
  location: { href: '', origin: 'http://lowdefy.com' },
  open: mockWindowOpen,
  scrollTo: mockWindowScrollTo,
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
  document,
  openidLogoutUrl,
  user,
  window,
};

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockImplementation(mockQueryImp);
  mockMutate.mockReset();
  mockMutate.mockImplementation(mockMutateImp);
  mockWindowOpen.mockReset();
  mockWindowFocus.mockReset();
  mockWindowScrollTo.mockReset();
  mockDocGetElementById.mockReset();
  mockDocGetElementById.mockImplementation(mockDocGetElementByIdImp);
  mockElemScrollIntoView.mockReset();
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
