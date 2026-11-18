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

import { setTimeout as sleep } from 'node:timers/promises';

import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';

import countStoreClients from './countStoreClients.js';
import startDataStoreReplSet from './startDataStoreReplSet.js';

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

const keeperAppName = 'lowdefy-test-store-keeper';
let replSet;
let keeper;

beforeAll(async () => {
  replSet = await startDataStoreReplSet();
  keeper = new MongoClient(replSet.getUri(), { appName: keeperAppName });
  await keeper.connect();
});

afterAll(async () => {
  await keeper?.close();
  await replSet?.stop({ doCleanup: true });
});

async function waitForCount(expected) {
  const deadline = Date.now() + 10000;
  let count;
  while (Date.now() < deadline) {
    count = await countStoreClients({ client: keeper, keeperAppName });
    if (count === expected) return count;
    await sleep(100);
  }
  return count;
}

test("countStoreClients counts other clients' connections, not the keeper's own or mongod's threads", async () => {
  expect(await waitForCount(0)).toEqual(0);
  const other = new MongoClient(replSet.getUri());
  await other.connect();
  await other.db('rows').collection('rows').insertOne({ _id: 1 });
  expect(await countStoreClients({ client: keeper, keeperAppName })).toBeGreaterThan(0);
  await other.close();
  expect(await waitForCount(0)).toEqual(0);
});
