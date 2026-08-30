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

import collectMigrationFiles, { checksumOf } from './collectMigrationFiles.js';

let configDirectory;

function writeMigration(fileName, content) {
  const dir = path.join(configDirectory, 'migrations');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-migrations-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('collectMigrationFiles returns an empty array when migrations/ does not exist', async () => {
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result).toEqual([]);
});

test('collectMigrationFiles derives the id from the filename stem and sorts lexically', async () => {
  writeMigration('2026-08-30-02-second.yaml', 'name: second\nroutine: []\n');
  writeMigration('2026-08-30-01-first.yaml', 'name: first\nroutine: []\n');
  writeMigration('2026-07-01-01-earliest.yml', 'name: earliest\nroutine: []\n');
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result.map((m) => m.id)).toEqual([
    '2026-07-01-01-earliest',
    '2026-08-30-01-first',
    '2026-08-30-02-second',
  ]);
});

test('collectMigrationFiles checksums the raw file text deterministically', async () => {
  writeMigration('2026-08-30-01-a.yaml', 'name: a\nroutine: []\n');
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result[0].checksum).toBe(checksumOf('name: a\nroutine: []\n'));
  expect(result[0].checksum).toHaveLength(16);
});

test('collectMigrationFiles parses name and routine', async () => {
  writeMigration(
    '2026-08-30-01-a.yaml',
    ['name: backfill active', 'routine:', '  - id: s1', '    type: MongoDBUpdateMany'].join('\n')
  );
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result[0].name).toBe('backfill active');
  expect(result[0].routine).toEqual([{ id: 's1', type: 'MongoDBUpdateMany' }]);
});

test('collectMigrationFiles ignores non-yaml files', async () => {
  writeMigration('2026-08-30-01-a.yaml', 'routine: []\n');
  writeMigration('README.md', '# notes\n');
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result.map((m) => m.id)).toEqual(['2026-08-30-01-a']);
});

test('collectMigrationFiles throws a ConfigError on invalid YAML', async () => {
  writeMigration('2026-08-30-01-bad.yaml', 'routine: [unclosed\n');
  await expect(
    collectMigrationFiles({ directories: { config: configDirectory } })
  ).rejects.toThrow('Migration "2026-08-30-01-bad" is not valid YAML');
});
