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
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import { type } from '@lowdefy/helpers';
import { afterAll, expect, test, vi } from 'vitest';

import dataSessionRegistry from './dataSessionRegistry.js';
import getRunDataStore from './getRunDataStore.js';
import isProcessAlive from './isProcessAlive.js';
import openDataSession from './openDataSession.js';
import { IDLE_STOP_MS } from './runDataStoreKeeper.js';

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

// A test file under a `node --test` runner (NODE_TEST_CONTEXT is set) that has not opened a
// session yet when its runner goes: it loads the harness, says so, waits until it has another
// parent, joins the run store, reports what it joined, and leaves.
const orphanScript = `
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const { default: getRunDataStore } = await import(process.env.RUN_STORE_MODULE);
const runnerPid = process.ppid;
fs.writeFileSync(process.env.RUN_STORE_LOADED, '');
while (process.ppid === runnerPid) {
  await sleep(20);
}
const store = await getRunDataStore({ logger: { info() {}, warn() {} } });
const admin = store.client.db('admin');
const { pid } = await admin.command({ serverStatus: 1 });
const { parsed } = await admin.command({ getCmdLineOpts: 1 });
fs.writeFileSync(
  process.env.RUN_STORE_REPORT,
  JSON.stringify({ keeperPid: store.keeperPid, mongodPid: pid, dbPath: parsed.storage.dbPath })
);
await store.stop();
`;

// The runner of that test file: it starts the file in a process group of its own, says so, and
// waits to be killed.
const runnerScript = `
import { spawn } from 'node:child_process';
const file = spawn(process.execPath, ['--input-type=module', '--eval', process.env.ORPHAN_SCRIPT], {
  detached: true,
  env: { ...process.env, NODE_TEST_CONTEXT: 'child-v8' },
  stdio: 'ignore',
});
file.unref();
console.log(JSON.stringify({ filePid: file.pid }));
setInterval(() => {}, 1000);
`;

// A test file under a `node --test` runner that joins the run store, holds a session on it until
// it is told to go, reports what it joined, and leaves. With RUN_STORE_STALE_URI it first
// writes a record for its owner that names a living keeper (itself) and a URI nothing answers.
const fileScript = `
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
const { default: getRunDataStore } = await import(process.env.RUN_STORE_MODULE);
const { default: getRunOwnerPid } = await import(process.env.RUN_OWNER_MODULE);
const { default: getRunStoreRecordPath } = await import(process.env.RUN_RECORD_PATH_MODULE);
const { default: writeRunStoreRecord } = await import(process.env.RUN_WRITE_RECORD_MODULE);
const ownerPid = getRunOwnerPid();
if (process.env.RUN_STORE_STALE_URI) {
  const recordPath = getRunStoreRecordPath({ ownerPid });
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid, keeperPid: process.pid, token: 'stale', uri: process.env.RUN_STORE_STALE_URI },
  });
}
const store = await getRunDataStore({ logger: { info() {}, warn() {} } });
const admin = store.client.db('admin');
const { pid } = await admin.command({ serverStatus: 1 });
const { parsed } = await admin.command({ getCmdLineOpts: 1 });
const report = { ownerPid, keeperPid: store.keeperPid, uri: store.uri, mongodPid: pid, dbPath: parsed.storage.dbPath };
fs.writeFileSync(process.env.RUN_STORE_REPORT, JSON.stringify(report));
while (process.env.RUN_STORE_RELEASE && !fs.existsSync(process.env.RUN_STORE_RELEASE)) {
  await sleep(50);
}
await store.stop();
`;

// A process that stays up and starts test files under it with NODE_TEST_CONTEXT set: a
// `node --test` runner, or a process that adopted the files before they loaded the harness (a
// subreaper), which names it their owner and never exits with the run. Each line on its stdin
// is a JSON object of environment for one file; it answers each with the file's pid.
const parentScript = `
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
for await (const line of createInterface({ input: process.stdin })) {
  const file = spawn(process.execPath, ['--input-type=module', '--eval', process.env.FILE_SCRIPT], {
    env: { ...process.env, ...JSON.parse(line), NODE_TEST_CONTEXT: 'child-v8' },
    stdio: 'inherit',
  });
  console.log(JSON.stringify({ filePid: file.pid }));
}
`;

function moduleHref(file) {
  return pathToFileURL(path.join(import.meta.dirname, file)).href;
}

function startParent() {
  const parent = spawn(process.execPath, ['--input-type=module', '--eval', parentScript], {
    env: {
      ...process.env,
      FILE_SCRIPT: fileScript,
      RUN_STORE_MODULE: moduleHref('getRunDataStore.js'),
      RUN_OWNER_MODULE: moduleHref('getRunOwnerPid.js'),
      RUN_RECORD_PATH_MODULE: moduleHref('getRunStoreRecordPath.js'),
      RUN_WRITE_RECORD_MODULE: moduleHref('writeRunStoreRecord.js'),
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const lines = createInterface({ input: parent.stdout })[Symbol.asyncIterator]();
  async function startFile(env) {
    parent.stdin.write(`${JSON.stringify(env)}\n`);
    const { value } = await lines.next();
    return JSON.parse(value).filePid;
  }
  return { parent, startFile };
}

function readReport(reportPath) {
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function stopKeeper(report) {
  // A keeper told to stop takes its mongod with it, so a failure leaves none behind.
  if (!type.isNone(report) && isProcessAlive({ pid: report.keeperPid })) {
    process.kill(report.keeperPid, 'SIGTERM');
  }
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

test('a test file whose runner was killed before it joined owns its store, which stops when the file exits', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-orphan-'));
  const loadedPath = path.join(directory, 'loaded');
  const reportPath = path.join(directory, 'report.json');
  const runner = spawn(process.execPath, ['--input-type=module', '--eval', runnerScript], {
    env: {
      ...process.env,
      ORPHAN_SCRIPT: orphanScript,
      RUN_STORE_MODULE: pathToFileURL(path.join(import.meta.dirname, 'getRunDataStore.js')).href,
      RUN_STORE_LOADED: loadedPath,
      RUN_STORE_REPORT: reportPath,
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [line] = await once(createInterface({ input: runner.stdout }), 'line');
  const { filePid } = JSON.parse(line);
  let report;
  try {
    expect(await waitFor(() => fs.existsSync(loadedPath))).toBe(true);
    runner.kill('SIGKILL');
    await once(runner, 'exit');
    expect(await waitFor(() => fs.existsSync(reportPath), { timeoutMs: 60000 })).toBe(true);
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(await waitFor(() => !isProcessAlive({ pid: filePid }))).toBe(true);
    // Owned by the process that adopted the file, the store would never stop.
    expect(await waitFor(() => isGone(report))).toBe(true);
  } finally {
    if (isProcessAlive({ pid: filePid })) process.kill(filePid, 'SIGKILL');
    // A keeper told to stop takes its mongod with it, so a failure here leaves none behind.
    if (!type.isNone(report) && isProcessAlive({ pid: report.keeperPid })) {
      process.kill(report.keeperPid, 'SIGTERM');
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
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

test('test files whose owner never exits leave no keeper and no mongod once none of them uses the store', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-reaper-'));
  const { parent, startFile } = startParent();
  const reports = [];
  const filePids = [];
  try {
    // Two files of one run under the same parent, each holding a session, share one store.
    const releasePath = path.join(directory, 'release');
    for (const name of ['a', 'b']) {
      const reportPath = path.join(directory, `${name}.json`);
      filePids.push(
        await startFile({ RUN_STORE_REPORT: reportPath, RUN_STORE_RELEASE: releasePath })
      );
      expect(await waitFor(() => fs.existsSync(reportPath), { timeoutMs: 60000 })).toBe(true);
      reports.push(readReport(reportPath));
    }
    const [first, second] = reports;
    expect(first.ownerPid).toEqual(parent.pid);
    expect(second.ownerPid).toEqual(parent.pid);
    expect(second.uri).toEqual(first.uri);
    expect(second.keeperPid).toEqual(first.keeperPid);

    fs.writeFileSync(releasePath, '');
    expect(await waitFor(() => filePids.every((pid) => !isProcessAlive({ pid })))).toBe(true);
    // The parent stands in for a subreaper: it is alive, neither the runner nor process 1.
    expect(isProcessAlive({ pid: parent.pid })).toBe(true);
    expect(await waitFor(() => isGone(first), { timeoutMs: IDLE_STOP_MS + 20000 })).toBe(true);
  } finally {
    // A file still waiting to be released would wait for good: its release file goes below.
    filePids
      .filter((pid) => isProcessAlive({ pid }))
      .forEach((pid) => process.kill(pid, 'SIGKILL'));
    reports.forEach(stopKeeper);
    parent.kill('SIGKILL');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a record whose keeper pid lives but whose URI does not answer is replaced by the next join', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-stale-'));
  const { parent, startFile } = startParent();
  const reportPath = path.join(directory, 'report.json');
  // A port nothing listens on: one a server had and gave back.
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  const staleUri = `mongodb://127.0.0.1:${port}/?replicaSet=testset`;
  let report;
  try {
    await startFile({ RUN_STORE_REPORT: reportPath, RUN_STORE_STALE_URI: staleUri });
    expect(await waitFor(() => fs.existsSync(reportPath), { timeoutMs: 60000 })).toBe(true);
    report = readReport(reportPath);
    expect(report.uri).not.toEqual(staleUri);
    expect(isProcessAlive({ pid: report.keeperPid })).toBe(true);
    // Its owner gone, the new store stops.
    parent.kill('SIGKILL');
    expect(await waitFor(() => isGone(report))).toBe(true);
  } finally {
    parent.kill('SIGKILL');
    stopKeeper(report);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
