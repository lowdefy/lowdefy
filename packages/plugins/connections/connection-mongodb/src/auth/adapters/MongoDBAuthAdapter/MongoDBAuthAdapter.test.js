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

const mockClient = {
  db: jest.fn((name) => ({ collection: jest.fn((model) => ({ name, model })) })),
};
const mockGetClient = jest.fn();
const mockMongodbAdapter = jest.fn(() => 'betterAuthAdapter');

jest.unstable_mockModule('../../../connections/MongoDBCollection/getClient.js', () => ({
  default: mockGetClient,
}));

jest.unstable_mockModule('../mongodbAdapter/mongodbAdapter.js', () => ({
  default: mockMongodbAdapter,
}));

beforeEach(() => {
  mockClient.db.mockClear();
  mockGetClient.mockReset();
  mockGetClient.mockResolvedValue(mockClient);
  mockMongodbAdapter.mockClear();
});

test('MongoDBAuthAdapter throws when uri is missing', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  expect(() => MongoDBAuthAdapter({ properties: {} })).toThrow(
    'MongoDBAuthAdapter requires "uri" property.'
  );
});

test('MongoDBAuthAdapter returns the vendored adapter over the selected database', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const adapter = MongoDBAuthAdapter({
    properties: { uri: 'mongodb://localhost:27017', database: 'auth' },
  });
  expect(mockMongodbAdapter).toHaveBeenCalledTimes(1);
  expect(adapter).toBe('betterAuthAdapter');
  const { getDb } = mockMongodbAdapter.mock.calls[0][0];
  const db = await getDb();
  expect(mockClient.db).toHaveBeenCalledWith('auth');
  expect(db.collection('user')).toEqual({ name: 'auth', model: 'user' });
});

test('MongoDBAuthAdapter does not connect until the first operation', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  MongoDBAuthAdapter({ properties: { uri: 'mongodb://localhost:27017', database: 'auth' } });
  expect(mockGetClient).not.toHaveBeenCalled();
});

test('MongoDBAuthAdapter resolves the client from getClient on every operation', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  MongoDBAuthAdapter({ properties: { uri: 'mongodb://localhost:27017', database: 'auth' } });
  const { getDb } = mockMongodbAdapter.mock.calls[0][0];
  const connectError = new Error('connect failed');
  mockGetClient.mockRejectedValueOnce(connectError);
  await expect(getDb()).rejects.toBe(connectError);
  await expect(getDb()).resolves.toBeDefined();
  expect(mockGetClient).toHaveBeenCalledTimes(2);
});

test('MongoDBAuthAdapter passes the uri and client options to getClient', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  MongoDBAuthAdapter({
    properties: {
      uri: 'mongodb://localhost:27017',
      database: 'auth',
      mongoDBClientOptions: { maxPoolSize: 3 },
    },
  });
  const { getDb } = mockMongodbAdapter.mock.calls[0][0];
  await getDb();
  expect(mockGetClient).toHaveBeenCalledWith({
    databaseUri: 'mongodb://localhost:27017',
    options: { maxPoolSize: 3 },
  });
});
