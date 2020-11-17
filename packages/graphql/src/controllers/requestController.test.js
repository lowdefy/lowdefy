/*
  Copyright 2020 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import createRequestController from './requestController';
import { testBootstrapContext } from '../test/testContext';
import resolvers from '../connections/resolvers';
import { ConfigurationError, RequestError } from '../context/errors';

jest.mock('../connections/resolvers', () => {
  const mockTestRequestResolver = jest.fn();
  return {
    TestConnection: {
      schema: {},
      requests: {
        TestRequest: {
          resolver: mockTestRequestResolver,
          schema: {},
        },
      },
    },
  };
});

const secrets = {
  CONNECTION: 'connectionSecret',
  REQUEST: 'requestSecret',
};

const getSecrets = () => secrets;

const mockLoadConnection = jest.fn();
const mockLoadRequest = jest.fn();
const loaders = {
  connection: {
    load: mockLoadConnection,
  },
  request: {
    load: mockLoadRequest,
  },
};

const context = testBootstrapContext({ loaders, getSecrets });

const defaultInput = {
  args: {},
  arrayIndices: [],
  blockId: 'contextId',
  input: {},
  lowdefyGlobal: {},
  pageId: 'pageId',
  requestId: 'requestId',
  state: {},
  urlQuery: {},
};

const defaultLoadConnectionImp = (id) => {
  if (id === 'testConnection') {
    return {
      id: 'connection:testConnection',
      type: 'TestConnection',
      connectionId: 'testConnection',
      properties: {
        connectionProperty: 'connectionProperty',
      },
    };
  }
  return null;
};

const defaultLoadRequestImp = ({ pageId, contextId, requestId }) => {
  if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
    return {
      id: 'request:pageId:contextId:requestId',
      type: 'TestRequest',
      requestId: 'requestId',
      connectionId: 'testConnection',
      properties: {
        requestProperty: 'requestProperty',
      },
    };
  }
  return null;
};

const defaultResolverImp = ({ request, connection }) => ({
  request,
  connection,
});

beforeEach(() => {
  mockLoadConnection.mockReset();
  mockLoadRequest.mockReset();
  resolvers.TestConnection.requests.TestRequest.resolver.mockReset();
});

test('call request', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  const res = await controller.callRequest(defaultInput);
  expect(res).toEqual({
    id: 'request:pageId:contextId:requestId',
    response: {
      connection: {
        connectionProperty: 'connectionProperty',
      },
      request: {
        requestProperty: 'requestProperty',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('request does not exist', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(() => null);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Request "requestId" does not exist.'
  );
});

test('request does not have a connectionId', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(({ pageId, contextId, requestId }) => {
    if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
      return {
        id: 'request:pageId:contextId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        properties: {
          requestProperty: 'requestProperty',
        },
      };
    }
    return null;
  });
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Request "requestId" does not specify a connection.'
  );
});

test('request is not a valid request type', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(({ pageId, contextId, requestId }) => {
    if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
      return {
        id: 'request:pageId:contextId:requestId',
        type: 'InvalidType',
        requestId: 'requestId',
        connectionId: 'testConnection',
        properties: {
          requestProperty: 'requestProperty',
        },
      };
    }
    return null;
  });
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Request "requestId" has invalid request type "InvalidType".'
  );
});

test('connection does not exist', async () => {
  mockLoadConnection.mockImplementation(() => null);
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Connection "testConnection" does not exist.'
  );
});

test('connection does not have correct type', async () => {
  mockLoadConnection.mockImplementation((id) => {
    if (id === 'testConnection') {
      return {
        id: 'connection:testConnection',
        type: 'OtherConnection',
        connectionId: 'testConnection',
        properties: {
          connectionProperty: 'connectionProperty',
        },
      };
    }
    return null;
  });
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Request "requestId" has invalid connection type "OtherConnection".'
  );
});

test('parse request properties for operators', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(({ pageId, contextId, requestId }) => {
    if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
      return {
        id: 'request:pageId:contextId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        properties: {
          args: { _args: 'value' },
          input: { _input: 'value' },
          global: { _global: 'value' },
          state: { _state: 'value' },
          urlQuery: { _url_query: 'value' },
          arrayIndices: { _state: 'array.$' },
        },
      };
    }
    return null;
  });
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  const res = await controller.callRequest({
    args: {
      value: 'argValue',
    },
    arrayIndices: [1],
    blockId: 'contextId',
    input: {
      value: 'inputValue',
    },
    lowdefyGlobal: {
      value: 'globalValue',
    },
    pageId: 'pageId',
    requestId: 'requestId',
    state: {
      value: 'stateValue',
      array: ['zero', 'one', 'two'],
    },
    urlQuery: {
      value: 'urlValue',
    },
  });
  expect(res).toEqual({
    id: 'request:pageId:contextId:requestId',
    response: {
      connection: {
        connectionProperty: 'connectionProperty',
      },
      request: {
        args: 'argValue',
        input: 'inputValue',
        global: 'globalValue',
        state: 'stateValue',
        urlQuery: 'urlValue',
        arrayIndices: 'one',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('parse connection properties for operators', async () => {
  mockLoadConnection.mockImplementation((id) => {
    if (id === 'testConnection') {
      return {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          args: { _args: 'value' },
          input: { _input: 'value' },
          global: { _global: 'value' },
          state: { _state: 'value' },
          urlQuery: { _url_query: 'value' },
          arrayIndices: { _state: 'array.$' },
        },
      };
    }
    return null;
  });
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  const res = await controller.callRequest({
    args: {
      value: 'argValue',
    },
    arrayIndices: [1],
    blockId: 'contextId',
    input: {
      value: 'inputValue',
    },
    lowdefyGlobal: {
      value: 'globalValue',
    },
    pageId: 'pageId',
    requestId: 'requestId',
    state: {
      value: 'stateValue',
      array: ['zero', 'one', 'two'],
    },
    urlQuery: {
      value: 'urlValue',
    },
  });
  expect(res).toEqual({
    id: 'request:pageId:contextId:requestId',
    response: {
      connection: {
        args: 'argValue',
        input: 'inputValue',
        global: 'globalValue',
        state: 'stateValue',
        urlQuery: 'urlValue',
        arrayIndices: 'one',
      },
      request: {
        requestProperty: 'requestProperty',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('parse secrets', async () => {
  mockLoadConnection.mockImplementation((id) => {
    if (id === 'testConnection') {
      return {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          secret: { _secret: 'CONNECTION' },
        },
      };
    }
    return null;
  });
  mockLoadRequest.mockImplementation(({ pageId, contextId, requestId }) => {
    if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
      return {
        id: 'request:pageId:contextId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        properties: {
          secret: { _secret: 'REQUEST' },
        },
      };
    }
    return null;
  });
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  const res = await controller.callRequest(defaultInput);
  expect(res).toEqual({
    id: 'request:pageId:contextId:requestId',
    response: {
      connection: {
        secret: 'connectionSecret',
      },
      request: {
        secret: 'requestSecret',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('request properties operator error', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(({ pageId, contextId, requestId }) => {
    if (`${pageId}:${contextId}:${requestId}` === 'pageId:contextId:requestId') {
      return {
        id: 'request:pageId:contextId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        properties: {
          willError: { _state: 0 },
        },
      };
    }
    return null;
  });
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(RequestError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Error: Operator Error: _state params must be of type string or object. Received: 0 at requestId.'
  );
});

test('connection properties operator error', async () => {
  mockLoadConnection.mockImplementation((id) => {
    if (id === 'testConnection') {
      return {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          willError: { _state: 0 },
        },
      };
    }
    return null;
  });
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(defaultResolverImp);
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(RequestError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(
    'Error: Operator Error: _state params must be of type string or object. Received: 0 at testConnection.'
  );
});

test('request resolver throws RequestError', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(() => {
    throw new RequestError('Test request error.');
  });
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(RequestError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow('Test request error.');
});

test('request resolver throws ConfigurationError', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(() => {
    throw new ConfigurationError('Test configuration error.');
  });
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(ConfigurationError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow('Test configuration error.');
});

test('request resolver throws generic error', async () => {
  mockLoadConnection.mockImplementation(defaultLoadConnectionImp);
  mockLoadRequest.mockImplementation(defaultLoadRequestImp);
  resolvers.TestConnection.requests.TestRequest.resolver.mockImplementation(() => {
    throw new Error('Test generic error.');
  });
  const controller = createRequestController(context);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow(RequestError);
  await expect(controller.callRequest(defaultInput)).rejects.toThrow('Test generic error.');
});
