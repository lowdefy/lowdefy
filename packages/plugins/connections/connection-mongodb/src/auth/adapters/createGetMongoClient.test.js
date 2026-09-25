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

const mockMongoClient = jest.fn((uri, options) => {
  const client = new EventEmitter();
  client.uri = uri;
  client.options = options;
  return client;
});

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: mockMongoClient,
}));

test('createGetMongoClient passes the uri and client options to the driver', async () => {
  const { default: createGetMongoClient } = await import('./createGetMongoClient.js');
  const getMongoClient = createGetMongoClient({
    databaseUri: 'mongodb://localhost:27017/auth',
    mongoDBClientOptions: { maxPoolSize: 5 },
  });
  expect(mockMongoClient).toHaveBeenCalledTimes(1);
  expect(getMongoClient()).toBe(mockMongoClient.mock.results[0].value);
  expect(getMongoClient().uri).toBe('mongodb://localhost:27017/auth');
  expect(getMongoClient().options).toEqual({ maxPoolSize: 5 });
});

test('createGetMongoClient returns the same client until its topology closes', async () => {
  const { default: createGetMongoClient } = await import('./createGetMongoClient.js');
  const getMongoClient = createGetMongoClient({ databaseUri: 'mongodb://localhost:27017/auth' });
  expect(getMongoClient()).toBe(getMongoClient());
  expect(mockMongoClient).toHaveBeenCalledTimes(1);
});

test('createGetMongoClient replaces the client once its topology closes', async () => {
  const { default: createGetMongoClient } = await import('./createGetMongoClient.js');
  const getMongoClient = createGetMongoClient({ databaseUri: 'mongodb://localhost:27017/auth' });
  const first = getMongoClient();
  first.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(2);
  const second = getMongoClient();
  expect(second).not.toBe(first);
  // A late close event from the replaced client does not churn the new one.
  first.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(2);
  expect(getMongoClient()).toBe(second);
  second.emit('topologyClosed');
  expect(mockMongoClient).toHaveBeenCalledTimes(3);
});
