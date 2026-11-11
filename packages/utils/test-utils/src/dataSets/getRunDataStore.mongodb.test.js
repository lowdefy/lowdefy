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

import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import { afterAll, expect, test, vi } from 'vitest';

import dataSessionRegistry from './dataSessionRegistry.js';
import getRunDataStore from './getRunDataStore.js';
import isProcessAlive from './isProcessAlive.js';
import openDataSession from './openDataSession.js';

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

const logger = { info: vi.fn(), warn: vi.fn() };

// The real keeper and mongod. This file runs in a worker process of its own, which no
// `node --test` runner started, so the worker is the owner of the store the tests here join:
// it stops when the worker exits. The owner tests start processes of their own to end.

const emptyDataSet = { name: 'sample', fixtures: {}, generated: {}, indexes: {}, collections: {} };
const stores = [];

async function join() {
  const store = await getRunDataStore({ logger });
  stores.push(store);
  return store;
}

async function describeMongod(store) {
  const admin = store.client.db('admin');
  const { pid } = await admin.command({ serverStatus: 1 });
  const { parsed } = await admin.command({ getCmdLineOpts: 1 });
  return { pid, parsed };
}

async function listDatabaseNames(store) {
  const { databases } = await store.client.db('admin').admin().listDatabases({ nameOnly: true });
  return databases.map((database) => database.name);
}

async function waitFor(check, { timeoutMs = 20000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(100);
  }
  return false;
}

// A process that is its own owner: it joins the run store, prints what it joined, and then
// either leaves or waits to be ended.
const ownerScript = `
const { default: getRunDataStore } = await import(process.env.RUN_STORE_MODULE);
const store = await getRunDataStore({ logger: { info() {}, warn() {} } });
const admin = store.client.db('admin');
const { pid } = await admin.command({ serverStatus: 1 });
const { parsed } = await admin.command({ getCmdLineOpts: 1 });
console.log(JSON.stringify({ keeperPid: store.keeperPid, mongodPid: pid, dbPath: parsed.storage.dbPath }));
if (process.env.RUN_STORE_HOLD === 'true') {
  setInterval(() => {}, 1000);
} else {
  await store.stop();
}
`;

async function startOwner({ hold }) {
  const owner = spawn(process.execPath, ['--input-type=module', '--eval', ownerScript], {
    env: {
      ...process.env,
      RUN_STORE_HOLD: String(hold),
      RUN_STORE_MODULE: pathToFileURL(path.join(import.meta.dirname, 'getRunDataStore.js')).href,
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [line] = await once(createInterface({ input: owner.stdout }), 'line');
  return { owner, ...JSON.parse(line) };
}

function isGone({ dbPath, keeperPid, mongodPid }) {
  return (
    !isProcessAlive({ pid: mongodPid }) &&
    !isProcessAlive({ pid: keeperPid }) &&
    !fs.existsSync(dbPath)
  );
}

afterAll(async () => {
  await Promise.all(stores.map((store) => store.stop()));
});

test('every join of a run gets its own client on one mongod, which holds the data store cache cap', async () => {
  const first = await join();
  const second = await join();
  expect(second.uri).toEqual(first.uri);
  expect(second.keeperPid).toEqual(first.keeperPid);
  expect(second.client).not.toBe(first.client);
  expect(first.perRun).toBe(true);
  const { parsed } = await describeMongod(first);
  expect(parsed.storage.wiredTiger.engineConfig.cacheSizeGB).toEqual(0.25);
  expect(parsed.replication.replSet).toBeDefined();
  // Stopping one join closes its client only: the store stays up for the other.
  await second.stop();
  expect(second.stopped).toBe(true);
  expect((await first.client.db('admin').command({ ping: 1 })).ok).toEqual(1);
  expect(isProcessAlive({ pid: first.keeperPid })).toBe(true);
});

test('a session on the run store names its databases after its process, and its sweep drops by run', async () => {
  const store = await join();
  // Another test process of the run that is still running (this worker's parent stands in for
  // it), and one that has exited.
  const running = `ld_p${process.ppid}_aaaaaaaaaaaa_0`;
  const exited = `ld_p${spawnSync(process.execPath, ['-e', '']).pid}_bbbbbbbbbbbb_0`;
  await store.client.db(running).collection('rows').insertOne({ _id: 1 });
  await store.client.db(exited).collection('rows').insertOne({ _id: 1 });

  const opened = await openDataSession({ dataSet: emptyDataSet, logger, store });
  expect(opened.session.prefix).toMatch(new RegExp(`^ld_p${process.pid}_[0-9a-f]{12}$`));
  expect(opened.session.databaseUri).toEqual(store.uri);
  await store.client.db(opened.session.databaseName).collection('rows').insertOne({ _id: 1 });

  const names = await listDatabaseNames(store);
  expect(names).toContain(running);
  expect(names).not.toContain(exited);
  expect(names).toContain(opened.session.databaseName);

  await opened.close();
  expect(await listDatabaseNames(store)).not.toContain(opened.session.databaseName);
  expect(dataSessionRegistry.has(opened.id)).toBe(false);
  await store.client.db(running).dropDatabase();
});

test('the store stops, with its directory and record removed, once its owner process has exited', async () => {
  const started = await startOwner({ hold: false });
  await once(started.owner, 'exit');
  expect(await waitFor(() => isGone(started))).toBe(true);
});

test("the store stops when its owner process is killed, which runs none of the owner's own handlers", async () => {
  const started = await startOwner({ hold: true });
  expect(isProcessAlive({ pid: started.mongodPid })).toBe(true);
  started.owner.kill('SIGKILL');
  await once(started.owner, 'exit');
  expect(await waitFor(() => isGone(started))).toBe(true);
});

test('the store stops when its owner process is interrupted', async () => {
  const started = await startOwner({ hold: true });
  started.owner.kill('SIGINT');
  await once(started.owner, 'exit');
  expect(await waitFor(() => isGone(started))).toBe(true);
});

test('a store whose keeper was killed is replaced by the next join, and its mongod does not outlive it', async () => {
  const dead = await join();
  const { pid: mongodPid } = await describeMongod(dead);
  process.kill(dead.keeperPid, 'SIGKILL');
  // mongodb-memory-server's own helper process stops a mongod whose parent died.
  expect(await waitFor(() => !isProcessAlive({ pid: mongodPid }))).toBe(true);
  await expect(openDataSession({ dataSet: emptyDataSet, logger, store: dead })).rejects.toThrow(
    'The test data store stopped responding'
  );
  expect(dead.stopped).toBe(true);
  const fresh = await join();
  expect(fresh.uri).not.toEqual(dead.uri);
  expect(fresh.keeperPid).not.toEqual(dead.keeperPid);
  const opened = await openDataSession({ dataSet: emptyDataSet, logger, store: fresh });
  await opened.close();
});
