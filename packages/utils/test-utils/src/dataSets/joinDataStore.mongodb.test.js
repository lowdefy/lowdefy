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

import { Worker } from 'node:worker_threads';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';

import dropThreadDatabases from './dropThreadDatabases.js';
import getDataStore from './getDataStore.js';
import openDataSession from './openDataSession.js';

const logger = { info: vi.fn(), warn: vi.fn() };

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

let store;

beforeAll(async () => {
  store = await getDataStore({ logger });
});

afterAll(async () => {
  await store.stop();
});

function makeDataSet(name, id) {
  return {
    name,
    fixtures: { items: [{ _id: id, name }] },
    generated: {},
    indexes: {},
    users: {},
    collections: { items: 'items' },
  };
}

function openInWorker(worker, dataSet) {
  return new Promise((resolve, reject) => {
    worker.once('error', reject);
    worker.once('message', (message) =>
      message.error ? reject(new Error(message.error)) : resolve(message)
    );
    worker.postMessage({ uri: store.uri, dataSet });
  });
}

async function listDatabaseNames() {
  const { databases } = await store.client.db('admin').admin().listDatabases({ nameOnly: true });
  return databases.map((database) => database.name);
}

// The dev server's journey threads open their sessions on the store its main thread started. Each
// thread's orphan sweep drops only its own databases, so neither drops a session the other holds,
// and a thread that stops without closing its sessions leaves databases only dropThreadDatabases
// drops.
test("a journey thread's session and the main thread's on one dev store keep their databases through each other's sweeps", async () => {
  const worker = new Worker(new URL('../../test/openJoinedSession.worker.mjs', import.meta.url));
  const first = await openInWorker(worker, makeDataSet('thread_one', 't1'));
  expect(first.prefix).toMatch(new RegExp(`^ld_p${process.pid}t${first.threadId}_[0-9a-f]{12}$`));

  // The main thread's open sweeps: the thread's live session stays.
  const main = await openDataSession({ dataSet: makeDataSet('main', 'm1'), logger });
  expect(main.session.prefix).toMatch(/^ld_[0-9a-f]{12}$/);
  expect(await listDatabaseNames()).toContain(first.databaseName);

  // The thread's next open sweeps: the main thread's live session stays.
  const second = await openInWorker(worker, makeDataSet('thread_two', 't2'));
  expect(await listDatabaseNames()).toEqual(
    expect.arrayContaining([first.databaseName, second.databaseName, main.session.databaseName])
  );
  expect(await store.client.db(first.databaseName).collection('items').find().toArray()).toEqual([
    { _id: 't1', name: 'thread_one' },
  ]);
  expect(
    await store.client.db(main.session.databaseName).collection('items').find().toArray()
  ).toEqual([{ _id: 'm1', name: 'main' }]);

  // The thread stops with both its sessions open: only its databases are dropped.
  await worker.terminate();
  await dropThreadDatabases({ client: store.client, threadId: first.threadId });
  const left = await listDatabaseNames();
  expect(left).not.toContain(first.databaseName);
  expect(left).not.toContain(second.databaseName);
  expect(left).toContain(main.session.databaseName);
  await main.close();
});
