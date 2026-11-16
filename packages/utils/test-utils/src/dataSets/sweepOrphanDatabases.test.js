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

import { spawnSync } from 'node:child_process';

import { afterEach, expect, test, vi } from 'vitest';

import dataSessionRegistry from './dataSessionRegistry.js';
import sweepOrphanDatabases from './sweepOrphanDatabases.js';

function createClient(names) {
  const dropped = [];
  return {
    dropped,
    client: {
      db: (name) => ({
        admin: () => ({
          listDatabases: vi.fn(async () => ({ databases: names.map((item) => ({ name: item })) })),
        }),
        dropDatabase: async () => {
          dropped.push(name);
        },
      }),
    },
  };
}

// The pid of a process that has exited.
function deadPid() {
  return spawnSync(process.execPath, ['-e', '']).pid;
}

afterEach(() => {
  dataSessionRegistry.clear();
});

test('sweepOrphanDatabases drops every session database no registered session owns and leaves other databases', async () => {
  dataSessionRegistry.set('a', { prefix: 'ld_aaaaaaaaaaaa' });
  const { client, dropped } = createClient([
    'admin',
    'local',
    'app_data',
    'ld_aaaaaaaaaaaa_0',
    'ld_aaaaaaaaaaaa_1',
    'ld_bbbbbbbbbbbb_0',
  ]);
  await sweepOrphanDatabases({ client });
  expect(dropped).toEqual(['ld_bbbbbbbbbbbb_0']);
});

test('sweepOrphanDatabases on a per-run store leaves the databases of another test process that is still running', async () => {
  // The parent of this process is running, and is not this process.
  const other = `ld_p${process.ppid}_cccccccccccc_0`;
  const { client, dropped } = createClient([other]);
  await sweepOrphanDatabases({ client, perRun: true });
  expect(dropped).toEqual([]);
});

test('sweepOrphanDatabases on a per-run store drops the databases of a test process that has exited', async () => {
  const left = `ld_p${deadPid()}_dddddddddddd_0`;
  const { client, dropped } = createClient([left]);
  await sweepOrphanDatabases({ client, perRun: true });
  expect(dropped).toEqual([left]);
});

test("sweepOrphanDatabases on a per-run store drops this process's own databases that no session owns, and keeps the ones a session owns", async () => {
  const owned = `ld_p${process.pid}_eeeeeeeeeeee`;
  dataSessionRegistry.set('e', { prefix: owned });
  const orphan = `ld_p${process.pid}_ffffffffffff_0`;
  const { client, dropped } = createClient([`${owned}_0`, orphan]);
  await sweepOrphanDatabases({ client, perRun: true });
  expect(dropped).toEqual([orphan]);
});

test("sweepOrphanDatabases without perRun drops a database that carries a running process's pid, as the dev server's store has one process", async () => {
  const other = `ld_p${process.ppid}_cccccccccccc_0`;
  const { client, dropped } = createClient([other]);
  await sweepOrphanDatabases({ client });
  expect(dropped).toEqual([other]);
});
