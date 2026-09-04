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
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError } from '@lowdefy/errors';

import callConnectionRequest from './callConnectionRequest.js';
import testContext from '../../test/testContext.js';

const { _secret } = operatorsServer;

const mockReadConfigFile = jest.fn();
const mockInsertMany = jest.fn();
const mockFind = jest.fn();

mockInsertMany.schema = {
  type: 'object',
  required: ['docs'],
  properties: { docs: { type: 'array' } },
};
mockInsertMany.meta = { checkRead: false, checkWrite: true };
mockFind.schema = {};
mockFind.meta = { checkRead: true, checkWrite: false };

const connections = {
  TestConnection: {
    schema: {},
    requests: { InsertMany: mockInsertMany, Find: mockFind },
  },
};

const context = testContext({
  connections,
  readConfigFile: mockReadConfigFile,
  operators: { _secret },
  secrets: { URI: 'mongodb://secret' },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockReadConfigFile.mockImplementation(async (name) => {
    if (name === 'connections/controls.json') {
      return {
        id: 'connection:controls',
        type: 'TestConnection',
        connectionId: 'controls',
        properties: { databaseUri: { _secret: 'URI' }, collection: 'controls', write: true },
      };
    }
    if (name === 'connections/readonly.json') {
      return {
        id: 'connection:readonly',
        type: 'TestConnection',
        connectionId: 'readonly',
        properties: { collection: 'readonly' },
      };
    }
    if (name === 'collections.json') {
      return {
        controls: { fields: { _id: { type: 'string' }, label: { type: 'string' } } },
      };
    }
    return null;
  });
  mockInsertMany.mockResolvedValue({ insertedCount: 2 });
});

test('callConnectionRequest evaluates connection operators and calls the resolver with tenant null', async () => {
  const docs = [{ _id: 'a' }, { _id: 'b' }];
  const result = await callConnectionRequest(context, {
    connectionId: 'controls',
    requestId: 'seed:controls',
    type: 'InsertMany',
    properties: { docs },
  });
  expect(result.response).toEqual({ insertedCount: 2 });
  expect(result.connectionProperties).toEqual({
    databaseUri: 'mongodb://secret',
    collection: 'controls',
    write: true,
  });
  expect(mockInsertMany).toHaveBeenCalledTimes(1);
  const call = mockInsertMany.mock.calls[0][0];
  expect(call.connection.databaseUri).toEqual('mongodb://secret');
  expect(call.connectionId).toEqual('controls');
  expect(call.request).toEqual({ docs });
  expect(call.requestId).toEqual('seed:controls');
  expect(call.tenant).toBeNull();
});

test('callConnectionRequest passes an explicit tenant through', async () => {
  const tenant = { field: 'organization_id', value: 'org_1' };
  await callConnectionRequest(context, {
    connectionId: 'controls',
    requestId: 'seed:controls',
    type: 'InsertMany',
    properties: { docs: [] },
    tenant,
  });
  expect(mockInsertMany.mock.calls[0][0].tenant).toEqual(tenant);
});

test('callConnectionRequest refuses a write on a connection without write: true', async () => {
  await expect(
    callConnectionRequest(context, {
      connectionId: 'readonly',
      requestId: 'seed:readonly',
      type: 'InsertMany',
      properties: { docs: [] },
    })
  ).rejects.toThrow(new ConfigError('Connection "readonly" does not allow writes.'));
  expect(mockInsertMany).not.toHaveBeenCalled();
});

test('callConnectionRequest throws when the connection does not exist', async () => {
  await expect(
    callConnectionRequest(context, {
      connectionId: 'missing',
      requestId: 'seed:missing',
      type: 'InsertMany',
      properties: { docs: [] },
    })
  ).rejects.toThrow('Connection "missing" does not exist.');
});

test('callConnectionRequest throws when the request type is not on the connection', async () => {
  await expect(
    callConnectionRequest(context, {
      connectionId: 'controls',
      requestId: 'seed:controls',
      type: 'Nope',
      properties: {},
    })
  ).rejects.toThrow('Request type "Nope" can not be found.');
});

test('callConnectionRequest validates the request properties against the resolver schema', async () => {
  await expect(
    callConnectionRequest(context, {
      connectionId: 'controls',
      requestId: 'seed:controls',
      type: 'InsertMany',
      properties: {},
    })
  ).rejects.toThrow(ConfigError);
  expect(mockInsertMany).not.toHaveBeenCalled();
});

test('callConnectionRequest resolves the collection schema and hands it to the resolver', async () => {
  await callConnectionRequest(context, {
    connectionId: 'controls',
    requestId: 'seed:controls',
    type: 'InsertMany',
    properties: { docs: [{ _id: 'a', label: 'A' }] },
  });
  expect(mockInsertMany.mock.calls[0][0].collectionSchema).toEqual({
    name: 'controls',
    fields: { _id: { type: 'string' }, label: { type: 'string' } },
    required: [],
  });
});

test('callConnectionRequest refuses a seeded document that violates collections.fields', async () => {
  // Stands in for the write resolvers' own field validation, which only runs
  // when the collection schema reaches them.
  mockInsertMany.mockImplementation(async ({ collectionSchema, request }) => {
    const unknown = Object.keys(request.docs[0]).find((field) => !collectionSchema.fields[field]);
    if (unknown) {
      throw new ConfigError(`Field "${unknown}" is not declared on collection "controls".`);
    }
    return { insertedCount: 1 };
  });
  await expect(
    callConnectionRequest(context, {
      connectionId: 'controls',
      requestId: 'seed:controls',
      type: 'InsertMany',
      properties: { docs: [{ _id: 'a', lable: 'typo' }] },
    })
  ).rejects.toThrow('Field "lable" is not declared on collection "controls".');
});

test('callConnectionRequest with rawProperties stores an operator-shaped document key verbatim', async () => {
  const docs = [{ _id: 'a', label: { _secret: 'URI' } }];
  const result = await callConnectionRequest(context, {
    connectionId: 'controls',
    requestId: 'seed:controls',
    type: 'InsertMany',
    properties: { docs },
    rawProperties: true,
  });
  expect(mockInsertMany.mock.calls[0][0].request).toEqual({ docs });
  // The connection's own properties are still evaluated.
  expect(result.connectionProperties.databaseUri).toEqual('mongodb://secret');
});
