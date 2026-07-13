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
import { MongoClient } from 'mongodb';

import getClient, { closeClients } from './getClient.js';

const databaseUri = process.env.MONGO_URL;

afterAll(async () => {
  await closeClients();
});

test('getClient returns a connected MongoClient', async () => {
  const client = await getClient({ databaseUri });
  expect(client).toBeInstanceOf(MongoClient);
});

test('getClient returns the same client for the same databaseUri and options', async () => {
  const promise1 = getClient({ databaseUri, options: { maxPoolSize: 7 } });
  const promise2 = getClient({ databaseUri, options: { maxPoolSize: 7 } });
  expect(promise1).toBe(promise2);
  const client1 = await promise1;
  const client2 = await promise2;
  expect(client1).toBe(client2);
});

test('getClient shares one client across concurrent calls before the first connect resolves', async () => {
  const [client1, client2] = await Promise.all([
    getClient({ databaseUri, options: { appName: 'concurrent' } }),
    getClient({ databaseUri, options: { appName: 'concurrent' } }),
  ]);
  expect(client1).toBe(client2);
});

test('getClient returns different clients for different options', async () => {
  const client1 = await getClient({ databaseUri, options: { maxPoolSize: 3 } });
  const client2 = await getClient({ databaseUri, options: { maxPoolSize: 4 } });
  expect(client1).not.toBe(client2);
});

test('getClient evicts failed connects so the next call retries', async () => {
  const unreachable = {
    databaseUri: 'mongodb://localhost:1',
    options: { serverSelectionTimeoutMS: 100 },
  };
  const promise1 = getClient(unreachable);
  await expect(promise1).rejects.toThrow();
  const promise2 = getClient(unreachable);
  expect(promise2).not.toBe(promise1);
  await expect(promise2).rejects.toThrow();
});

test('getClient creates a new client after closeClients', async () => {
  const client1 = await getClient({ databaseUri, options: { appName: 'close' } });
  await closeClients();
  const client2 = await getClient({ databaseUri, options: { appName: 'close' } });
  expect(client2).not.toBe(client1);
});
