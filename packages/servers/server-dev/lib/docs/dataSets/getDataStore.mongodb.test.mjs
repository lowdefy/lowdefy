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

import fs from 'node:fs';
import { jest } from '@jest/globals';

import getDataStore from './getDataStore.js';
import openDataSession from './openDataSession.js';
import { MIN_PORT } from './pickDataStorePort.js';

jest.setTimeout(120000);

// The real memory replica set, in a process of its own (jest runs each file in its own worker), so
// killing its mongod here touches no other suite's store.

async function describeMongod(store) {
  const admin = store.client.db('admin');
  const { pid } = await admin.command({ serverStatus: 1 });
  const { parsed } = await admin.command({ getCmdLineOpts: 1 });
  return { pid, dbPath: parsed.storage.dbPath };
}

test('the data store binds a port in the dynamic range and removes its directory when it stops', async () => {
  const store = await getDataStore();
  const port = Number(new URL(store.uri).port);
  expect(port).toBeGreaterThanOrEqual(MIN_PORT);
  expect(port).toBeLessThanOrEqual(65535);
  const { dbPath } = await describeMongod(store);
  expect(fs.existsSync(dbPath)).toBe(true);
  await store.stop();
  expect(fs.existsSync(dbPath)).toBe(false);
});

test('a store whose mongod died is replaced: the next session reports it, the one after runs on a new store', async () => {
  const dead = await getDataStore();
  const { pid, dbPath } = await describeMongod(dead);
  process.kill(pid, 'SIGKILL');
  await expect(openDataSession({ dataSet: { name: 'shop', snapshot: null } })).rejects.toThrow(
    'The journey data store stopped responding'
  );
  expect(fs.existsSync(dbPath)).toBe(false);
  const fresh = await getDataStore();
  expect(fresh).not.toBe(dead);
  expect(fresh.uri).not.toEqual(dead.uri);
  const opened = await openDataSession({
    dataSet: { name: 'shop', snapshot: null, fixtures: {}, indexes: {}, collections: {} },
  });
  await opened.close();
  await fresh.stop();
});
