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

import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';

const mockMongoClient = jest.fn(() => {
  const client = new EventEmitter();
  client.db = jest.fn((name) => ({ collection: jest.fn((model) => ({ client, name, model })) }));
  return client;
});
const mockMongodbAdapter = jest.fn(() => 'betterAuthAdapter');

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: mockMongoClient,
}));

jest.unstable_mockModule('../mongodbAdapter/mongodbAdapter.js', () => ({
  default: mockMongodbAdapter,
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

test('MongoDBAuthAdapter returns the vendored adapter over the selected database', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const adapter = MongoDBAuthAdapter({
    properties: { uri: 'mongodb://localhost:27017', database: 'auth' },
  });
  expect(mockMongodbAdapter).toHaveBeenCalledTimes(1);
  expect(adapter).toBe('betterAuthAdapter');
  const { db } = mockMongodbAdapter.mock.calls[0][0];
  const clientInstance = mockMongoClient.mock.results[0].value;
  expect(db.collection('user')).toEqual({ client: clientInstance, name: 'auth', model: 'user' });
});

test('MongoDBAuthAdapter replaces the client once its topology closes', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  MongoDBAuthAdapter({ properties: { uri: 'mongodb://localhost:27017', database: 'auth' } });
  const { db } = mockMongodbAdapter.mock.calls[0][0];
  const first = mockMongoClient.mock.results[0].value;
  first.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(2);
  const second = mockMongoClient.mock.results[1].value;
  expect(db.collection('session').client).toBe(second);
  // A late close event from the replaced client does not churn the new one.
  first.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(2);
  second.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(3);
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
