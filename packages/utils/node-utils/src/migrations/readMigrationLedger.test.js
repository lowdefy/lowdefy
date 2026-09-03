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

import getMigrationLedgerPath from './getMigrationLedgerPath.js';
import readMigrationLedger from './readMigrationLedger.js';
import writeMigrationLedger from './writeMigrationLedger.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ledger-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('getMigrationLedgerPath places the ledger under .lowdefy/migrations/<stage>.json', () => {
  expect(getMigrationLedgerPath({ configDirectory: '/app', stage: 'prod' })).toBe(
    path.join('/app', '.lowdefy', 'migrations', 'prod.json')
  );
});

test('readMigrationLedger returns an empty ledger when the file does not exist', async () => {
  await expect(readMigrationLedger({ configDirectory, stage: 'prod' })).resolves.toEqual({
    stage: 'prod',
    applied: [],
  });
});

test('writeMigrationLedger writes sorted, pretty-printed entries that readMigrationLedger reads back', async () => {
  const ledgerPath = await writeMigrationLedger({
    configDirectory,
    stage: 'prod',
    applied: [
      { id: '2026-02-01-01-b', checksum: 'bb' },
      { id: '2026-01-01-01-a', checksum: 'aa', appliedAt: '2026-01-02T00:00:00.000Z' },
    ],
  });
  expect(ledgerPath).toBe(getMigrationLedgerPath({ configDirectory, stage: 'prod' }));
  const text = fs.readFileSync(ledgerPath, 'utf8');
  expect(text.endsWith('\n')).toBe(true);
  expect(text).toContain('\n  "applied": [\n');
  const ledger = await readMigrationLedger({ configDirectory, stage: 'prod' });
  expect(ledger.applied.map((entry) => entry.id)).toEqual(['2026-01-01-01-a', '2026-02-01-01-b']);
});

test('readMigrationLedger rejects malformed JSON instead of treating it as empty', async () => {
  const ledgerPath = getMigrationLedgerPath({ configDirectory, stage: 'prod' });
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, '{ not json');
  await expect(readMigrationLedger({ configDirectory, stage: 'prod' })).rejects.toThrow(
    'is not valid'
  );
});

test('readMigrationLedger rejects an entry without id and checksum', async () => {
  const ledgerPath = getMigrationLedgerPath({ configDirectory, stage: 'prod' });
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify({ stage: 'prod', applied: [{ id: 'x' }] }));
  await expect(readMigrationLedger({ configDirectory, stage: 'prod' })).rejects.toThrow(
    'applied[0] must be an object with string "id" and "checksum"'
  );
});

test('readMigrationLedger rejects a ledger that records a different stage', async () => {
  await writeMigrationLedger({ configDirectory, stage: 'prod', applied: [] });
  fs.renameSync(
    getMigrationLedgerPath({ configDirectory, stage: 'prod' }),
    getMigrationLedgerPath({ configDirectory, stage: 'dev' })
  );
  await expect(readMigrationLedger({ configDirectory, stage: 'dev' })).rejects.toThrow(
    'records stage "prod" but is being read as stage "dev"'
  );
});
