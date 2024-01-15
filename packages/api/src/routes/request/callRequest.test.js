/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { jest } from '@jest/globals';
import { operatorsServer } from '@lowdefy/operators-js';

import callRequest from './callRequest.js';
import testContext from '../../test/testContext.js';

import { ConfigurationError, RequestError } from '../../context/errors.js';

const { _date, _payload, _secret, _user } = operatorsServer;

console.error = () => {};

const mockReadConfigFile = jest.fn();
const mockTestRequest = jest.fn();
const mockTestRequestCheckRead = jest.fn();
const mockTestRequestCheckWrite = jest.fn();

mockTestRequest.schema = {
  type: 'object',
  properties: {
    schemaPropString: {
      type: 'string',
    },
  },
};
mockTestRequestCheckRead.schema = {};
mockTestRequestCheckWrite.schema = {};

mockTestRequest.meta = {
  checkRead: false,
  checkWrite: false,
};
mockTestRequestCheckRead.meta = {
  checkRead: true,
  checkWrite: false,
};
mockTestRequestCheckWrite.meta = {
  checkRead: false,
  checkWrite: true,
};

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
      TestRequest: mockTestRequest,
      TestRequestCheckRead: mockTestRequestCheckRead,
      TestRequestCheckWrite: mockTestRequestCheckWrite,
    },
  },
};

const operators = {
  _date,
  _payload,
  _secret,
  _user,
  _error: () => {
    throw new Error('Test error.');
  },
};

const secrets = {
  CONNECTION: 'connectionSecret',
  REQUEST: 'requestSecret',
};

const context = testContext({
  connections,
  readConfigFile: mockReadConfigFile,
  operators,
  secrets,
});
const authenticatedContext = testContext({
  connections,
  readConfigFile: mockReadConfigFile,
  operators,
  secrets,
  session: { user: { sub: 'sub' } },
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
      pageId: 'pageId',
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
  mockTestRequest.mockReset();
  mockTestRequestCheckRead.mockReset();
  mockTestRequestCheckWrite.mockReset();
});

test('call request, public auth', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequest.mockImplementation(defaultResolverImp);
  const res = await callRequest(context, defaultParams);
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(authenticatedContext, defaultParams);
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
    'Request "requestId" does not exist.'
  );
});

test('request does not exist', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequest.mockImplementation(defaultResolverImp);
  const params = {
    pageId: 'pageId',
    payload: {},
    requestId: 'doesNotExist',
  };
  await expect(callRequest(context, params)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, params)).rejects.toThrow(
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

  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          payload: { _payload: true },
          payloadDate: { _payload: 'date' },
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await callRequest(context, {
    blockId: 'contextId',
    payload: {
      date: { '~d': 0 },
    },
    pageId: 'pageId',
    requestId: 'requestId',
  });
  expect(mockTestRequest.mock.calls).toEqual([
    [
      {
        connection: {
          connectionProperty: 'connectionProperty',
        },
        connectionId: 'testConnection',
        pageId: 'pageId',
        requestId: 'requestId',
        blockId: 'contextId',
        payload: { date: new Date(0) },
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          payload: { _payload: 'value' },
          user: { _user: 'sub' },
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(authenticatedContext, {
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(authenticatedContext, {
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

test('evaluate secrets', async () => {
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          secret: { _secret: 'REQUEST' },
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          willError: { _error: null },
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Error: Test error.');
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
          willError: { _error: null },
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Error: Test error.');
});

test('request resolver throws  error', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequest.mockImplementation(() => {
    throw new Error('Test error.');
  });

  await expect(callRequest(context, defaultParams)).rejects.toThrow(RequestError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Test error.');
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
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('must be string');
});

test('request properties schema error', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {
          schemaPropString: true,
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('must be string');
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckRead.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckRead.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckRead.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckWrite.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckWrite.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
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
        pageId: 'pageId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: {},
      },
    })
  );
  mockTestRequestCheckWrite.mockImplementation(defaultResolverImp);

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigurationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
    'Connection "testConnection" does not allow writes.'
  );
});
