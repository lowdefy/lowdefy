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

const mockDb = { collection: jest.fn() };
const mockMongoClient = jest.fn(() => ({ db: jest.fn(() => mockDb) }));
const mockMongodbAdapter = jest.fn(() => 'betterAuthAdapter');

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: mockMongoClient,
}));

jest.unstable_mockModule('better-auth/adapters/mongodb', () => ({
  mongodbAdapter: mockMongodbAdapter,
}));

beforeEach(() => {
  mockMongoClient.mockClear();
  mockMongodbAdapter.mockClear();
});

test('MongoDBAuthAdapter throws when uri is missing', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  expect(() => MongoDBAuthAdapter({ properties: {} })).toThrow(
    'MongoDBAuthAdapter requires "uri" property.'
  );
});

test('MongoDBAuthAdapter opts into native sub-document storage for json fields', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const adapter = MongoDBAuthAdapter({
    properties: { uri: 'mongodb://localhost:27017', database: 'auth' },
  });
  expect(mockMongodbAdapter).toHaveBeenCalledTimes(1);
  expect(mockMongodbAdapter).toHaveBeenCalledWith(mockDb, { supportsJSON: true });
  expect(adapter).toBe('betterAuthAdapter');
});

test('MongoDBAuthAdapter passes client options and database selection through', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  MongoDBAuthAdapter({
    properties: {
      uri: 'mongodb://localhost:27017',
      database: 'auth',
      mongoDBClientOptions: { maxPoolSize: 3 },
    },
  });
  expect(mockMongoClient).toHaveBeenCalledWith('mongodb://localhost:27017', { maxPoolSize: 3 });
  const clientInstance = mockMongoClient.mock.results[0].value;
  expect(clientInstance.db).toHaveBeenCalledWith('auth');
});
