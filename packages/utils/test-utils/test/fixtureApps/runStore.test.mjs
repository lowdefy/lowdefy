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

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import { MongoClient } from 'mongodb';
import { afterEach, expect, test } from 'vitest';

import getRunStoreRecordPath from '../../src/dataSets/getRunStoreRecordPath.js';
import isProcessAlive from '../../src/dataSets/isProcessAlive.js';
import readRunStoreRecord from '../../src/dataSets/readRunStoreRecord.js';
import copyFixtureApp from './copyFixtureApp.mjs';
import fixtureApps from './fixtureApps.mjs';

// The way an app runs its endpoint tests: `node --test` over several files, one process a
// file. The run has one data store, which the first file starts and the rest join, and it is
// gone when the runner is, however the runner ends.

const FILES = ['billing', 'orders', 'users'];

// Each file opens a session, writes, says which database it wrote to, and then waits for the
// suite to let it finish, so every file of the run is alive at once.
const endpointTest = `import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';

const { openTestApp } = await import(process.env.TEST_UTILS_ENTRY);

const app = await openTestApp({
  configDirectory: process.env.TEST_CONFIG_DIRECTORY,
  serverDirectory: process.env.TEST_SERVER_DIRECTORY,
});
let session;

before(async () => {
  session = await app.openSession({ data: 'explore' });
});
after(() => app.close());

test('a member logs activity on a database of this file', async () => {
  const name = path.basename(import.meta.filename, '.test.mjs');
  const answer = await session.as('member').call('log_activity', { source: name });
  assert.equal(answer.status, 200);
  const collection = session.collection('fixture_db');
  assert.equal(await collection.countDocuments({ kind: 'activity' }), 1);
  fs.writeFileSync(
    path.join(process.env.TEST_REPORT_DIRECTORY, name + '.json'),
    JSON.stringify({ pid: process.pid, databaseName: collection.dbName })
  );
  while (!fs.existsSync(path.join(process.env.TEST_REPORT_DIRECTORY, 'release'))) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});
`;

const copies = [];
const started = [];

async function waitFor(check, { timeoutMs = 60000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(100);
  }
  return false;
}

// Starts `node --test` on the three files and waits until each has written to its database.
// Returns the runner, each file's report, and the run's store: its record, and its mongod's
// pid and directory, read from the store itself.
async function startRun() {
  const copy = copyFixtureApp({ app: fixtureApps.journeyFixture });
  copies.push(copy);
  const testDirectory = path.join(copy.configDirectory, 'tests', 'endpoints');
  const reportDirectory = path.join(copy.configDirectory, 'reports');
  fs.mkdirSync(testDirectory, { recursive: true });
  fs.mkdirSync(reportDirectory);
  const testFiles = FILES.map((name) => path.join(testDirectory, `${name}.test.mjs`));
  testFiles.forEach((testFile) => fs.writeFileSync(testFile, endpointTest));

  let output = '';
  const runner = spawn(process.execPath, ['--test', '--test-concurrency=3', ...testFiles], {
    env: {
      ...process.env,
      TEST_CONFIG_DIRECTORY: copy.configDirectory,
      TEST_REPORT_DIRECTORY: reportDirectory,
      TEST_SERVER_DIRECTORY: copy.serverDirectory,
      TEST_UTILS_ENTRY: pathToFileURL(path.join(import.meta.dirname, '../../src/index.js')).href,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  runner.stdout.on('data', (chunk) => {
    output += chunk;
  });
  runner.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const run = { runner, reportDirectory, getOutput: () => output, reports: [] };
  started.push(run);

  const reportFiles = FILES.map((name) => path.join(reportDirectory, `${name}.json`));
  const reported = await waitFor(() => reportFiles.every((file) => fs.existsSync(file)));
  if (!reported) {
    throw new Error(`The test files did not all report.\n${output}`);
  }
  run.reports = reportFiles.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));

  run.recordPath = getRunStoreRecordPath({ ownerPid: runner.pid });
  run.record = readRunStoreRecord({ recordPath: run.recordPath });
  const client = new MongoClient(run.record.uri);
  await client.connect();
  const admin = client.db('admin');
  run.mongodPid = (await admin.command({ serverStatus: 1 })).pid;
  run.dbPath = (await admin.command({ getCmdLineOpts: 1 })).parsed.storage.dbPath;
  run.databaseNames = (await admin.admin().listDatabases({ nameOnly: true })).databases.map(
    (database) => database.name
  );
  await client.close();
  return run;
}

function isStoreGone(run) {
  return (
    !isProcessAlive({ pid: run.mongodPid }) &&
    !isProcessAlive({ pid: run.record.keeperPid }) &&
    !fs.existsSync(run.dbPath) &&
    !fs.existsSync(run.recordPath)
  );
}

afterEach(() => {
  // A test file whose runner was killed is not the runner's to stop any more.
  started.splice(0).forEach((run) => {
    run.runner.kill('SIGKILL');
    run.reports.forEach((report) => {
      if (isProcessAlive({ pid: report.pid })) process.kill(report.pid, 'SIGKILL');
    });
  });
  copies.splice(0).forEach((copy) => copy.remove());
});

test('the files of one node --test run share one data store, each on databases of its own, and it stops when the run ends', async () => {
  const run = await startRun();
  // One store: the runner's record, which every file joined.
  expect(run.record.ownerPid).toEqual(run.runner.pid);
  expect(isProcessAlive({ pid: run.mongodPid })).toBe(true);
  const pids = run.reports.map((report) => report.pid);
  expect(new Set(pids).size).toEqual(3);
  run.reports.forEach((report) => {
    expect(report.databaseName).toMatch(new RegExp(`^ld_p${report.pid}_[0-9a-f]{12}_0$`));
    expect(run.databaseNames).toContain(report.databaseName);
  });

  fs.writeFileSync(path.join(run.reportDirectory, 'release'), '');
  const [code] = await once(run.runner, 'exit');
  expect(run.getOutput()).toMatch(/pass 3\b/);
  expect(code).toEqual(0);
  expect(await waitFor(() => isStoreGone(run), { timeoutMs: 20000 })).toBe(true);
});

test('killing the node --test runner mid-run leaves no mongod', async () => {
  const run = await startRun();
  expect(isProcessAlive({ pid: run.mongodPid })).toBe(true);
  run.runner.kill('SIGKILL');
  await once(run.runner, 'exit');
  expect(await waitFor(() => isStoreGone(run), { timeoutMs: 20000 })).toBe(true);
});

test('interrupting the node --test runner mid-run leaves no mongod', async () => {
  const run = await startRun();
  run.runner.kill('SIGINT');
  await once(run.runner, 'exit');
  expect(await waitFor(() => isStoreGone(run), { timeoutMs: 20000 })).toBe(true);
});
