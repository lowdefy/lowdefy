/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { compile } from '@lowdefy/ajv';
import { operatorsServer } from '@lowdefy/operators-js';

import callRequest from './callRequest.js';
import testContext from '../../test/testContext.js';

import {
  AuthenticationError,
  AuthorizationError,
  ConfigError,
  RequestError,
} from '@lowdefy/errors';

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
  TestTenantConnection: {
    meta: { tenant: true },
    schema: {},
    requests: {
      TestRequest: mockTestRequest,
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
  user: { id: 'id' },
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

afterEach(() => {
  mockTestRequest.meta.checkWrite = false;
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

test('call request, protected auth without user throws AuthenticationError', async () => {
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(AuthenticationError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
    'Authentication required for request "requestId".'
  );
});

test('call request, protected auth with user missing the required roles stays opaque', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: false, roles: ['admin'] },
        properties: {
          requestProperty: 'requestProperty',
        },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(authenticatedContext, defaultParams)).rejects.toThrow(
    AuthorizationError
  );
  await expect(callRequest(authenticatedContext, defaultParams)).rejects.toThrow(
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
  await expect(callRequest(context, params)).rejects.toThrow(ConfigError);
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Connection id is missing.');
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
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
        callApi: expect.any(Function),
        connection: {
          connectionProperty: 'connectionProperty',
        },
        connectionId: 'testConnection',
        pageId: 'pageId',
        requestId: 'requestId',
        blockId: 'contextId',
        payload: { date: new Date(0) },
        collectionSchema: null,
        request: {
          payload: { date: new Date(0) },
          payloadDate: new Date(0),
        },
        tenant: null,
      },
    ],
  ]);
});

test('tenant connection passes the tenant verdict to the resolver', async () => {
  const organizationContext = testContext({
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    organization: { policy: 'tenant' },
    secrets,
    user: { id: 'id', organization_id: 'org-1' },
  });
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestTenantConnection',
        connectionId: 'testConnection',
        tenant: true,
        properties: {},
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await callRequest(organizationContext, defaultParams);
  expect(mockTestRequest.mock.calls[0][0].tenant).toEqual({
    field: 'organization_id',
    value: 'org-1',
  });
});

test('tenant connection without a caller organization throws AuthenticationError', async () => {
  const orglessTenantContext = testContext({
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    organization: { policy: 'tenant' },
    secrets,
    user: { id: 'id' },
  });
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestTenantConnection',
        connectionId: 'testConnection',
        tenant: true,
        properties: {},
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await expect(callRequest(orglessTenantContext, defaultParams)).rejects.toThrow(
    AuthenticationError
  );
  await expect(callRequest(orglessTenantContext, defaultParams)).rejects.toThrow(
    'Request "requestId" reads tenant connection "testConnection" but no caller organization resolved.'
  );
});

test('tenant connection resolves a null verdict under the pinned policy', async () => {
  const pinnedContext = testContext({
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    organization: { policy: 'pinned' },
    secrets,
    user: { id: 'id', organization_id: 'org-1' },
  });
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestTenantConnection',
        connectionId: 'testConnection',
        tenant: true,
        properties: {},
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);

  await callRequest(pinnedContext, defaultParams);
  expect(mockTestRequest.mock.calls[0][0].tenant).toBe(null);
});

test('evaluate request properties operators', async () => {
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
          user: { _user: 'id' },
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
        user: 'id',
      },
    },
    success: true,
    type: 'TestRequest',
  });
});

test('evaluate connection properties operators', async () => {
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: {
          payload: { _payload: 'value' },
          user: { _user: 'id' },
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
        user: 'id',
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(Error);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Test error.');
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(Error);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('Test error.');
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('must be type "string"');
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow('must be type "string"');
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
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

  await expect(callRequest(context, defaultParams)).rejects.toThrow(ConfigError);
  await expect(callRequest(context, defaultParams)).rejects.toThrow(
    'Connection "testConnection" does not allow writes.'
  );
});

test('call request redacts an error returned inside the response value', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  // A resolver is free to return an error as data rather than throwing - a
  // per-item failure from a batch write is the realistic shape. makeReplacer
  // wraps any Error it meets anywhere in a value, so this response is an
  // error-serialization site and takes the same policy as the error field.
  mockTestRequest.mockImplementation(() => {
    const itemError = new RequestError('Item 2 rejected.', {
      received: { apiKey: 'super-secret' },
    });
    return { written: 1, failed: [itemError] };
  });

  const res = await callRequest(context, defaultParams);

  const serializedItemError = res.response.failed[0]['~e'];
  expect(serializedItemError.message).toBe('Item 2 rejected.');
  expect(serializedItemError.received).toBeUndefined();
  expect(serializedItemError.stack).toBeUndefined();
  expect(JSON.stringify(res)).not.toContain('super-secret');
});

test('call request normalises source on an error returned inside the response value', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequest.mockImplementation(() => {
    const itemError = new RequestError('Item 2 rejected.');
    itemError.source = `${process.cwd()}/pages/home.yaml:5`;
    return { failed: [itemError] };
  });
  const configDirectoryContext = testContext({
    configDirectory: process.cwd(),
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    secrets,
  });

  const res = await callRequest(configDirectoryContext, defaultParams);

  expect(res.response.failed[0]['~e'].source).toBe('pages/home.yaml:5');
});

test('callRequest without trace adds nothing to the result or the resolver arguments', async () => {
  mockReadConfigFile.mockImplementation(defaultReadConfigImp());
  mockTestRequest.mockImplementation(defaultResolverImp);

  const res = await callRequest(context, defaultParams);
  expect(Object.keys(res).sort()).toEqual(['id', 'response', 'success', 'type']);
  expect(mockTestRequest.mock.calls[0][0].trace).toBeUndefined();
});

test('callRequest with trace collects the connection, the tenant verdict and the evaluated properties, and hands trace to the resolver', async () => {
  const organizationContext = testContext({
    connections,
    readConfigFile: mockReadConfigFile,
    operators,
    organization: { policy: 'tenant' },
    secrets,
    user: { id: 'id', organization_id: 'org-1' },
  });
  mockReadConfigFile.mockImplementation(
    defaultReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestTenantConnection',
        connectionId: 'testConnection',
        tenant: true,
        properties: {},
      },
      requestConfig: {
        id: 'request:pageId:requestId',
        type: 'TestRequest',
        requestId: 'requestId',
        connectionId: 'testConnection',
        auth: { public: true },
        properties: { org: { _user: 'organization_id' }, q: { _payload: 'q' } },
      },
    })
  );
  mockTestRequest.mockImplementation(({ trace }) => {
    trace.effective = { query: { q: 'x', organization_id: 'org-1' } };
    return 'ok';
  });

  const trace = { rewritten: [] };
  const res = await callRequest(organizationContext, {
    ...defaultParams,
    payload: { q: 'x' },
    trace,
  });
  expect(res.response).toBe('ok');
  expect(trace).toEqual({
    connection: {
      id: 'testConnection',
      type: 'TestTenantConnection',
      tenant: { field: 'organization_id', value: 'org-1' },
    },
    requestType: 'TestRequest',
    properties: { org: 'org-1', q: 'x' },
    dispatched: true,
    effective: { query: { q: 'x', organization_id: 'org-1' } },
    rewritten: [],
  });
});

// Write validation: the field contract from build/collections.json is
// resolved from the evaluated connection collection and handed to the
// resolver as collectionSchema, beside tenant.
const collectionsArtifact = {
  answers: {
    fields: {
      test_id: { type: 'string' },
      result: { enum: ['pass', 'fail', 'partial', 'na'] },
    },
    relations: {},
    indexes: [],
    connections: [],
  },
  controls: { tenant: 'shared', relations: {}, indexes: [], connections: [] },
};

const collectionsReadConfigImp =
  ({ connectionConfig }) =>
  (path) => {
    if (path === 'collections.json') {
      return collectionsArtifact;
    }
    return defaultReadConfigImp({ connectionConfig })(path);
  };

test('callRequest resolves collectionSchema from the evaluated connection collection', async () => {
  // Only write types consult the contract.
  mockTestRequest.meta.checkWrite = true;
  mockReadConfigFile.mockImplementation(
    collectionsReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: { write: true, collection: { _payload: 'collection' } },
      },
    })
  );
  mockTestRequest.mockImplementation(defaultResolverImp);
  await callRequest(context, { ...defaultParams, payload: { collection: 'answers' } });
  expect(mockTestRequest.mock.calls[0][0].collectionSchema).toEqual({
    name: 'answers',
    fields: collectionsArtifact.answers.fields,
    required: [],
  });
  expect(mockTestRequest.mock.calls[0][0].connection).toEqual({ write: true, collection: 'answers' });
});

test('callRequest passes a null collectionSchema to a read type without touching the artifact', async () => {
  mockTestRequest.mockImplementation(defaultResolverImp);
  mockReadConfigFile.mockImplementation(
    collectionsReadConfigImp({
      connectionConfig: {
        id: 'connection:testConnection',
        type: 'TestConnection',
        connectionId: 'testConnection',
        properties: { collection: 'answers' },
      },
    })
  );
  await callRequest(context, defaultParams);
  expect(mockTestRequest.mock.calls[0][0].collectionSchema).toBe(null);
  expect(mockReadConfigFile.mock.calls.map(([path]) => path)).not.toContain('collections.json');
});

test('callRequest passes a null collectionSchema when the collection is undeclared or declares no fields', async () => {
  mockTestRequest.meta.checkWrite = true;
  mockTestRequest.mockImplementation(defaultResolverImp);
  for (const collection of ['controls', 'unknown']) {
    mockReadConfigFile.mockImplementation(
      collectionsReadConfigImp({
        connectionConfig: {
          id: 'connection:testConnection',
          type: 'TestConnection',
          connectionId: 'testConnection',
          properties: { write: true, collection },
        },
      })
    );
    await callRequest(context, defaultParams);
  }
  expect(mockTestRequest.mock.calls[0][0].collectionSchema).toBe(null);
  expect(mockTestRequest.mock.calls[1][0].collectionSchema).toBe(null);
});

test('callRequest passes a null collectionSchema when the connection names no collection', async () => {
  mockReadConfigFile.mockImplementation(collectionsReadConfigImp({}));
  mockTestRequest.mockImplementation(defaultResolverImp);
  await callRequest(context, defaultParams);
  expect(mockTestRequest.mock.calls[0][0].collectionSchema).toBe(null);
  expect(mockReadConfigFile).not.toHaveBeenCalledWith('collections.json');
});

// End to end through callRequest: a resolver that enforces the contract the
// way the MongoDB write types do - validate the declared fields of the
// written doc, throw a ConfigError naming field, expectation and value.
function contractEnforcingResolver({ collectionSchema, request }) {
  if (collectionSchema) {
    Object.keys(collectionSchema.fields).forEach((fieldName) => {
      if (!(fieldName in request.doc)) return;
      const { valid, errors } = compile({ schema: collectionSchema.fields[fieldName] })(
        request.doc[fieldName]
      );
      if (!valid) {
        throw new ConfigError(
          `Field "${fieldName}" in an insert document for collection "${
            collectionSchema.name
          }" does not match the declared contract: ${errors[0].message}. Received ${JSON.stringify(
            request.doc[fieldName]
          )}.`
        );
      }
    });
  }
  return { acknowledged: true };
}

test('callRequest runs a conforming and a violating write through the resolver with the resolved contract', async () => {
  const requestConfig = {
    id: 'request:pageId:requestId',
    type: 'TestRequestCheckWrite',
    requestId: 'requestId',
    pageId: 'pageId',
    connectionId: 'testConnection',
    auth: { public: true },
    properties: { doc: { _payload: 'doc' } },
    '~k': 'request_key',
  };
  const connectionConfig = {
    id: 'connection:testConnection',
    type: 'TestConnection',
    connectionId: 'testConnection',
    properties: { collection: 'answers', write: true },
  };
  mockReadConfigFile.mockImplementation((path) => {
    if (path === 'collections.json') return collectionsArtifact;
    if (path === 'connections/testConnection.json') return connectionConfig;
    if (path === 'pages/pageId/requests/requestId.json') return requestConfig;
    return null;
  });
  mockTestRequestCheckWrite.mockImplementation(contractEnforcingResolver);

  const ok = await callRequest(context, {
    ...defaultParams,
    payload: { doc: { test_id: 't1', result: 'pass', reviewed_by: 'u1' } },
  });
  expect(ok.response).toEqual({ acknowledged: true });

  let thrown;
  try {
    await callRequest(context, {
      ...defaultParams,
      payload: { doc: { test_id: 't1', result: 'Pass' } },
    });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toEqual(
    'Field "result" in an insert document for collection "answers" does not match the declared contract: must be equal to one of the allowed values. Received "Pass".'
  );
  expect(thrown.configKey).toEqual('request_key');
  expect(mockTestRequestCheckWrite).toHaveBeenCalledTimes(2);
  expect(mockTestRequestCheckWrite.mock.calls[1][0].collectionSchema).toEqual({
    name: 'answers',
    fields: collectionsArtifact.answers.fields,
    required: [],
  });
});
