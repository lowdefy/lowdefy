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
  const filePath = path.join(configDirectory, 'migrations', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
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
  await expect(collectMigrationFiles({ directories: { config: configDirectory } })).rejects.toThrow(
    'Migration "2026-08-30-01-bad" is not valid YAML'
  );
});

test('collectMigrationFiles sorts by code units, not locale collation', async () => {
  // localeCompare would order 'a-B' before 'a-a' in many locales; migration
  // order must be byte-deterministic across machines.
  writeMigration('a-a.yaml', 'routine: []\n');
  writeMigration('a-B.yaml', 'routine: []\n');
  writeMigration('Z.yaml', 'routine: []\n');
  const result = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(result.map((m) => m.id)).toEqual(['Z', 'a-B', 'a-a']);
});

test("collectMigrationFiles throws a ConfigError on a typo'd key", async () => {
  writeMigration(
    '2026-08-30-01-a.yaml',
    ['name: backfill active', 'routines:', '  - id: s1', '    type: MongoDBUpdateMany'].join('\n')
  );
  await expect(collectMigrationFiles({ directories: { config: configDirectory } })).rejects.toThrow(
    'Migration "2026-08-30-01-a" is invalid: A migration file has an unknown property. The only allowed properties are "name" and "routine".'
  );
});

test('collectMigrationFiles throws a ConfigError when routine is missing', async () => {
  writeMigration('2026-08-30-01-a.yaml', 'name: backfill active\n');
  await expect(collectMigrationFiles({ directories: { config: configDirectory } })).rejects.toThrow(
    'Migration "2026-08-30-01-a" is invalid: A migration file requires a "routine".'
  );
});

test('collectMigrationFiles discovers migrations in nested directories, byte-sorted', async () => {
  writeMigration('0002-b.yaml', 'name: b\nroutine: []\n');
  writeMigration(path.join('2026', '0001-a.yaml'), 'name: a\nroutine: []\n');
  const migrations = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(migrations.map((migration) => migration.id)).toEqual(['0002-b', '2026/0001-a']);
});

test('collectMigrationFiles skips underscore prefixed directories', async () => {
  writeMigration('0001-a.yaml', 'name: a\nroutine: []\n');
  writeMigration(path.join('_drafts', '0002-b.yaml'), 'name: b\nroutine: []\n');
  const migrations = await collectMigrationFiles({ directories: { config: configDirectory } });
  expect(migrations.map((migration) => migration.id)).toEqual(['0001-a']);
});

test('collectMigrationFiles throws when two files share one migration id', async () => {
  writeMigration('2026-08-30-01-a.yaml', 'routine: []\n');
  writeMigration('2026-08-30-01-a.yml', 'routine: []\n');
  await expect(collectMigrationFiles({ directories: { config: configDirectory } })).rejects.toThrow(
    'Migration id "2026-08-30-01-a" is declared by two files: "2026-08-30-01-a.yaml" and "2026-08-30-01-a.yml".'
  );
});
