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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { wait } from '@lowdefy/helpers';
import { getProcessStartTime, isPidAlive } from '@lowdefy/node-utils';

import pruneServers from './pruneServers.js';

// pruneServers against real processes this test spawns, on every platform the
// tests run on, Windows included: a record carries a start time, prune stops a
// server whose owner is gone, and never signals a pid that names another
// process. Only processes spawned here are ever signalled.

const spawned = [];
let directory;

function spawnIdle() {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  spawned.push(child);
  return child;
}

function exited(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve) => child.once('exit', resolve));
}

function writeRecord({ server, processStartTime, owner }) {
  const record = {
    pid: server.pid,
    processStartTime,
    kind: 'server',
    cwd: directory,
    configDirectory: directory,
    port: 3112,
    owner: {
      pid: owner.pid,
      processStartTime: getProcessStartTime({ pid: owner.pid }),
      via: 'exit-with-pid',
    },
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(directory, `${server.pid}.json`), JSON.stringify(record));
  return record;
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prune-processes-'));
});

afterEach(async () => {
  spawned.forEach((child) => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
  });
  await Promise.all(spawned.map(exited));
  spawned.length = 0;
  fs.rmSync(directory, { recursive: true, force: true });
});

test('pruneServers with kill stops a spawned server whose owner is gone', async () => {
  const owner = spawnIdle();
  const server = spawnIdle();
  const record = writeRecord({
    server,
    processStartTime: getProcessStartTime({ pid: server.pid }),
    owner,
  });
  expect(record.processStartTime).not.toBeNull();
  expect(record.owner.processStartTime).not.toBeNull();

  owner.kill('SIGKILL');
  await exited(owner);
  const candidates = await pruneServers({
    directory,
    hubRegistryPath: path.join(directory, 'no-hub-registry.json'),
    kill: true,
    graceMs: 5000,
  });

  expect(candidates).toEqual([
    expect.objectContaining({ source: 'registry', pid: server.pid, result: 'stopped' }),
  ]);
  await exited(server);
  expect(isPidAlive(server.pid)).toBe(false);
  expect(fs.existsSync(path.join(directory, `${server.pid}.json`))).toBe(false);
}, 60000);

test('pruneServers never signals a spawned process whose start time differs from the record', async () => {
  const owner = spawnIdle();
  // A live process on the record's pid, but not the process the record was written for.
  const other = spawnIdle();
  writeRecord({ server: other, processStartTime: 'another process', owner });

  owner.kill('SIGKILL');
  await exited(owner);
  const candidates = await pruneServers({
    directory,
    hubRegistryPath: path.join(directory, 'no-hub-registry.json'),
    kill: true,
    graceMs: 5000,
  });

  expect(candidates).toEqual([]);
  await wait(500);
  expect(other.exitCode).toBeNull();
  expect(other.signalCode).toBeNull();
}, 60000);
