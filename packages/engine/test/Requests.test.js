import RequestsClass from '../src/Requests';

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
  req_watch: {
    data: {
      request: {
        id: 'req_watch',
        success: true,
        response: 2,
      },
    },
  },
  req_error: new Error('mock error'),
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
const client = { query: mockQuery };

const rootBlock = {
  requests: [
    {
      requestId: 'req_one',
    },
    {
      requestId: 'req_error',
    },
    {
      requestId: 'req_watch',
    },
  ],
};

const blockId = 'one';
const branch = 'master';
const input = {};
const lowdefyGlobal = {};
const pageId = 'one';
const state = {};
const urlQuery = {};

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockImplementation(mockQueryImp);
});

test('callRequest', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await Requests.callRequest({ requestId: 'req_one' });
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
  });
});

test('callRequests all requests', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  const promise = Requests.callRequests();
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
    req_error: {
      error: [],
      loading: true,
      response: null,
    },
    req_watch: {
      error: [],
      loading: true,
      response: null,
    },
  });
  try {
    await promise;
  } catch (e) {
    // catch thrown errors
  }
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
    req_error: {
      error: [new Error('mock error')],
      loading: false,
      response: null,
    },
    req_watch: {
      error: [null],
      loading: false,
      response: 2,
    },
  });
  expect(mockQuery).toHaveBeenCalledTimes(3);
});

test('callRequests', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  const promise = Requests.callRequests({ requestIds: ['req_one'], onlyNew: true });
  expect(context.requests).toEqual({
    req_one: {
      error: [],
      loading: true,
      response: null,
    },
  });
  await promise;
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
  });
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('callRequest error', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await expect(Requests.callRequest({ requestId: 'req_error' })).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: {
      error: [new Error('mock error')],
      loading: false,
      response: null,
    },
  });
  await expect(Requests.callRequest({ requestId: 'req_error' })).rejects.toThrow();
  expect(context.requests).toEqual({
    req_error: {
      error: [new Error('mock error'), new Error('mock error')],
      loading: false,
      response: null,
    },
  });
});

test('callRequest that is not on root block', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await expect(Requests.callRequest({ requestId: 'req_does_not_exist' })).rejects.toThrow(
    'Configuration Error: Request req_does_not_exist not defined on context.'
  );
});

test('callRequest on root block with no requests', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock: {},
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await expect(Requests.callRequest({ requestId: 'req_does_not_exist' })).rejects.toThrow(
    'Configuration Error: Request req_does_not_exist not defined on context.'
  );
});

test('callRequest request does not exist', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await expect(Requests.callRequest({ requestId: 'req_two' })).rejects.toThrow(
    'Configuration Error: Request req_two not defined on context.'
  );
  expect(context.requests).toEqual({
    req_two: {
      error: [new Error('Configuration Error: Request req_two not defined on context.')],
      loading: false,
      response: null,
    },
  });
});

test('callRequest not called the same request twice with onlyNew true', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await Requests.callRequest({ requestId: 'req_one', onlyNew: true });
  expect(context.requests).toEqual({
    req_one: {
      error: [null],
      loading: false,
      response: 1,
    },
  });
  await Requests.callRequest({ requestId: 'req_one', onlyNew: true });
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('update unction should be called', async () => {
  const updateFunction = jest.fn();
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: updateFunction,
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  await Requests.callRequest({ requestId: 'req_one' });
  expect(updateFunction).toHaveBeenCalledTimes(1);
});

test('fetch should set blocks loading and call query every time it is called', async () => {
  const context = {
    blockId,
    branch,
    client,
    input,
    lowdefyGlobal,
    pageId,
    requests: {},
    state,
    rootBlock,
    update: jest.fn(),
    urlQuery,
  };
  const Requests = new RequestsClass(context);
  const setBlocksLoadingCacheFunction = jest.fn();
  context.RootBlocks = {
    setBlocksLoadingCache: setBlocksLoadingCacheFunction,
  };
  await Requests.callRequest({ requestId: 'req_one', onlyNew: true });
  expect(setBlocksLoadingCacheFunction).toHaveBeenCalledTimes(1);
  expect(mockQuery).toHaveBeenCalledTimes(1);
  Requests.fetch('req_one');
  expect(setBlocksLoadingCacheFunction).toHaveBeenCalledTimes(2);
  expect(mockQuery).toHaveBeenCalledTimes(2);
});
