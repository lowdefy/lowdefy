/*
  Copyright 2020-2021 Lowdefy, Inc

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

import requestHandler from './request';
import testContext from '../../test/testContext';

import { ConfigurationError, RequestError } from '../../context/errors';

console.error = () => {};

const mockReadConfigFile = jest.fn();
const mockTestRequestResolver = jest.fn();

const connections = {
  TestConnection: {
    schema: {
      type: 'object',
      properties: {
        schemaPropString: {
          type: 'string',
        },
      },
    },
    requests: {
      TestRequest: {
        resolver: mockTestRequestResolver,
        schema: {
          type: 'object',
          properties: {
            schemaPropString: {
              type: 'string',
            },
          },
        },
      },
      TestRequestCheckRead: {
        resolver: mockTestRequestResolver,
        schema: {},
        checkRead: true,
      },
      TestRequestCheckWrite: {
        resolver: mockTestRequestResolver,
        schema: {},
        checkWrite: true,
      },
    },
  },
};

const secrets = {
  CONNECTION: 'connectionSecret',
  REQUEST: 'requestSecret',
};

const context = testContext({ connections, readConfigFile: mockReadConfigFile, secrets });
const authenticatedContext = testContext({
  connections,
  readConfigFile: mockReadConfigFile,
  secrets,
  user: { sub: 'sub' },
});

const defaultParams = {
  pageId: 'pageId',
  payload: {},
  requestId: 'requestId',
};

const defaultReadConfigImp =
  ({
    connectionConfig = {
      id: 'connection:testConnection',
      type: 'TestConnection',
      connectionId: 'testConnection',
      properties: {
        connectionProperty: 'connectionProperty',
      },
    },
    requestConfig = {
      id: 'request:pageId:requestId',
      type: 'TestRequest',
      requestId: 'requestId',
      connectionId: 'testConnection',
      auth: { public: true },
      properties: {
        requestProperty: 'requestProperty',
      },
    },
  } = {}) =>
  (path) => {
    if (path === 'connections/testConnection.json') {
      return connectionConfig;
    }
    if (path === 'pages/pageId/requests/requestId.json') {
      return requestConfig;
    }
    return null;
  };

const defaultResolverImp = ({ request, connection }) => ({
  request,
  connection,
});

beforeEach(() => {
  mockReadConfigFile.mockReset();
  mockTestRequestResolver.mockReset();
});

test('call request, public auth', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequestResolver.mockImplementation(defaultResolverImp);
  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
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

test('call request, protected auth with user', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: false },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(authenticatedContext, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
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

test('call request, protected auth without user', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: false },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Request "requestId" does not exist.'
  );
});

test('request does not exist', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequestResolver.mockImplementation(defaultResolverImp);
  const params = {
    pageId: 'pageId',
    payload: {},
    requestId: 'doesNotExist',
  };
  await expect(requestHandler(context, params)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, params)).rejects.toThrow(
    'Request "doesNotExist" does not exist.'
  );
});

test('request does not have a connectionId', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        auth: { public: true },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );

  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Request "requestId" does not specify a connection.'
  );
});

test('request is not a valid request type', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'InvalidType',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Request type "InvalidType" can not be found.'
  );
});

test('connection does not exist', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'InvalidType',
        requestId: 'requestId',
        connectionId: 'doesNotExist',
        auth: { public: true },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Connection "doesNotExist" does not exist.'
  );
});

test('connection does not have correct type', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'OtherConnection',
        connectionId: 'testConnection',
        properties: {
          connectionProperty: 'connectionProperty',
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Connection type "OtherConnection" can not be found.'
  );
});

test('deserialize inputs', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          payload: { _payload: true },
          payloadDate: { _payload: 'date' },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await requestHandler(context, {
    blockId: 'contextId',
    payload: {
      date: { _date: 0 },
    },
    pageId: 'pageId',
    requestId: 'requestId',
  });
  expect(mockTestRequestResolver.mock.calls).toEqual([
    [
      {
        connection: {
          connectionProperty: 'connectionProperty',
        },
        request: {
          payload: { date: new Date(0) },
          payloadDate: new Date(0),
        },
      },
    ],
  ]);
});

test('parse request properties for operators', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          payload: { _payload: 'value' },
          user: { _user: 'sub' },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(authenticatedContext, {
    blockId: 'contextId',
    payload: {
      value: 'payloadValue',
    },
    pageId: 'pageId',
    requestId: 'requestId',
  });
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {
        connectionProperty: 'connectionProperty',
      },
      request: {
        payload: 'payloadValue',
        user: 'sub',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('parse connection properties for operators', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          payload: { _payload: 'value' },
          user: { _user: 'sub' },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(authenticatedContext, {
    blockId: 'contextId',
    payload: {
      value: 'payloadValue',
    },
    pageId: 'pageId',
    requestId: 'requestId',
  });
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {
        payload: 'payloadValue',
        user: 'sub',
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
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          secret: { _secret: 'CONNECTION' },
        },
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          secret: { _secret: 'REQUEST' },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
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

test('request properties default value', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {
        connectionProperty: 'connectionProperty',
      },
      request: {},
    },
    success: true,
    type: 'TestRequest',
  });
});

test('connection properties default value', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {},
      request: {
        requestProperty: 'requestProperty',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('request properties operator error', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          willError: { _get: null },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Error: Operator Error: _get takes an object as params. Received: null at requestId.'
  );
});

test('connection properties operator error', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          willError: { _get: null },
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Error: Operator Error: _get takes an object as params. Received: null at testConnection.'
  );
});

test('request resolver throws  error', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequestResolver.mockImplementation(() => {
    throw new Error('Test error.');
  });

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow('Test error.');
});

test('connection properties schema error', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          schemaPropString: true,
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow('should be string');
});

test('request properties schema error', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          schemaPropString: true,
        },
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow('should be string');
});

test('checkRead, read explicitly true', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          read: true,
        },
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckRead',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {
        read: true,
      },
      request: {},
    },
    success: true,
    type: 'TestRequestCheckRead',
  });
});

test('checkRead, read explicitly false', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          read: false,
        },
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckRead',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Connection "testConnection" does not allow reads.'
  );
});

test('checkRead, read not set', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckRead',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {},
      request: {},
    },
    success: true,
    type: 'TestRequestCheckRead',
  });
});

test('checkWrite, write explicitly true', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          write: true,
        },
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckWrite',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  const res = await requestHandler(context, defaultParams);
  expect(res).toEqual({
    id: 'request:pageId:requestId',
    response: {
      connection: {
        write: true,
      },
      request: {},
    },
    success: true,
    type: 'TestRequestCheckWrite',
  });
});

test('checkWrite, write explicitly false', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          write: false,
        },
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckWrite',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Connection "testConnection" does not allow writes.'
  );
});

test('checkWrite, write not set', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {},
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequestCheckWrite',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestResolver.mockImplementation(defaultResolverImp);

  await expect(requestHandler(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(requestHandler(context, defaultParams)).rejects.toThrow(
    'Connection "testConnection" does not allow writes.'
  );
});
