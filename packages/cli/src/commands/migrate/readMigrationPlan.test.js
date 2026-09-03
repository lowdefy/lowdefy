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
import os from 'node:os';
import path from 'node:path';

import readMigrationPlan from './readMigrationPlan.js';

let configDirectory;
let directory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plan-'));
  directory = path.join(configDirectory, '.lowdefy', 'server');
  fs.mkdirSync(path.join(directory, 'build'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeIndex(index) {
  fs.writeFileSync(path.join(directory, 'build', 'migrations.json'), JSON.stringify(index));
}

function writeLedger(stage, applied) {
  const dir = path.join(configDirectory, '.lowdefy', 'migrations');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${stage}.json`), JSON.stringify({ stage, applied }));
}

test('readMigrationPlan lists index migrations the ledger does not record with a matching checksum', async () => {
  writeIndex({
    stage: 'prod',
    migrations: [
      { id: 'm1', checksum: 'a' },
      { id: 'm2', checksum: 'b' },
      { id: 'm3', checksum: 'c' },
    ],
  });
  writeLedger('prod', [
    { id: 'm1', checksum: 'a' },
    { id: 'm2', checksum: 'CHANGED' },
  ]);
  const plan = await readMigrationPlan({
    context: { directories: { config: configDirectory } },
    directory,
    stage: 'prod',
  });
  expect(plan.stage).toBe('prod');
  expect(plan.buildStage).toBe('prod');
  expect(plan.ledgerPath).toBe(path.join(configDirectory, '.lowdefy', 'migrations', 'prod.json'));
  expect(plan.pending).toEqual(['m2', 'm3']);
});

test('readMigrationPlan tolerates a missing index and ledger', async () => {
  const plan = await readMigrationPlan({
    context: { directories: { config: configDirectory } },
    directory,
    stage: 'local',
  });
  expect(plan.pending).toEqual([]);
  expect(plan.buildStage).toBeNull();
});
