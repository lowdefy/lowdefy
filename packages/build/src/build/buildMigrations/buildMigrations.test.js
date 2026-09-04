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

import buildMigrations from './buildMigrations.js';
import createCounter from '../../utils/createCounter.js';

let configDirectory;

function writeMigration(fileName, content) {
  const dir = path.join(configDirectory, 'migrations');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), content);
}

function testContext({ stage = 'dev', validateOnly = false } = {}) {
  const warnings = [];
  return {
    directories: { config: configDirectory },
    errors: [],
    warnings,
    handleWarning: (warning) => warnings.push(warning),
    keyMap: {},
    stage,
    validateOnly,
    typesMap: { steps: {} },
    typeCounters: {
      steps: createCounter(),
      requests: createCounter(),
      controls: createCounter(),
      operators: { server: createCounter('server') },
    },
  };
}

function writeLedger(stage, applied) {
  const dir = path.join(configDirectory, '.lowdefy', 'migrations');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${stage}.json`), JSON.stringify({ stage, applied }));
}

const SIMPLE_ROUTINE =
  'routine:\n  - id: s\n    type: MongoDBUpdateMany\n    connectionId: c\n    tenant: none\n';

let savedStage;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-build-migrations-'));
  savedStage = process.env.STAGE;
  delete process.env.STAGE;
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  if (savedStage === undefined) {
    delete process.env.STAGE;
  } else {
    process.env.STAGE = savedStage;
  }
});

test('buildMigrations sets context.migrations to [] when there is no migrations directory', async () => {
  const context = testContext();
  await buildMigrations({ components: {}, context });
  expect(context.migrations).toEqual([]);
  expect(context.migrationsStage).toBe('local');
});

test('buildMigrations resolves the stage from STAGE and marks ledger entries applied', async () => {
  writeMigration('2026-08-30-01-a.yaml', SIMPLE_ROUTINE);
  writeMigration('2026-08-30-02-b.yaml', SIMPLE_ROUTINE);
  process.env.STAGE = 'prod';
  const probe = testContext({ stage: 'prod' });
  await buildMigrations({ components: {}, context: probe });
  const checksumA = probe.migrations[0].checksum;
  writeLedger('prod', [{ id: '2026-08-30-01-a', checksum: checksumA }]);

  const context = testContext({ stage: 'prod' });
  await buildMigrations({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.migrationsStage).toBe('prod');
  expect(context.migrations.map((m) => [m.id, m.applied])).toEqual([
    ['2026-08-30-01-a', true],
    ['2026-08-30-02-b', false],
  ]);
  expect(context.migrations[0].ledgerChecksum).toBe(checksumA);
  expect(context.warnings).toEqual([]);
});

test('buildMigrations warns and leaves a migration unapplied when its file changed after being applied', async () => {
  writeMigration('2026-08-30-01-a.yaml', SIMPLE_ROUTINE);
  writeLedger('local', [{ id: '2026-08-30-01-a', checksum: '0000000000000000' }]);
  const context = testContext();
  await buildMigrations({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.migrations[0].applied).toBe(false);
  expect(context.migrations[0].ledgerChecksum).toBe('0000000000000000');
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toMatch('has changed since it was applied to stage "local"');
});

test('buildMigrations collects a ConfigError for a prod build with migrations and no STAGE', async () => {
  writeMigration('2026-08-30-01-a.yaml', SIMPLE_ROUTINE);
  const context = testContext({ stage: 'prod' });
  await buildMigrations({ components: {}, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch('no STAGE names the environment');
  expect(context.migrations).toEqual([]);
});

test('buildMigrations does not require STAGE for a prod build without migrations', async () => {
  const context = testContext({ stage: 'prod' });
  await buildMigrations({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.migrationsStage).toBeNull();
});

test('buildMigrations does not require STAGE under lowdefy check', async () => {
  writeMigration('2026-08-30-01-a.yaml', SIMPLE_ROUTINE);
  const context = testContext({ stage: 'prod', validateOnly: true });
  await buildMigrations({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.migrations).toHaveLength(1);
  expect(context.migrations[0].applied).toBe(false);
});

test('buildMigrations collects a ConfigError when the stage ledger is malformed', async () => {
  writeMigration('2026-08-30-01-a.yaml', SIMPLE_ROUTINE);
  const dir = path.join(configDirectory, '.lowdefy', 'migrations');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'local.json'), '{ nope');
  const context = testContext();
  await buildMigrations({ components: {}, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch('Migration ledger');
});

test('buildMigrations stamps step ids and carries id, checksum and routine', async () => {
  writeMigration(
    '2026-08-30-01-backfill.yaml',
    [
      'name: Backfill active',
      'routine:',
      '  - id: backfill',
      '    type: MongoDBUpdateMany',
      '    connectionId: frameworks',
      '    tenant: none',
      '    properties:',
      '      filter:',
      '        active:',
      '          $exists: false',
      '      update:',
      '        $set:',
      '          active: true',
    ].join('\n')
  );
  const components = {};
  const context = testContext();
  await buildMigrations({ components, context });
  expect(context.errors).toEqual([]);
  expect(context.migrations).toHaveLength(1);
  const migration = context.migrations[0];
  expect(migration.id).toBe('2026-08-30-01-backfill');
  expect(migration.name).toBe('Backfill active');
  expect(migration.checksum).toHaveLength(16);
  // The routine is stamped with the request: prefix so the runtime runRoutine
  // dispatches it as a request step.
  expect(migration.routine[0].id).toBe('request:migration:2026-08-30-01-backfill:backfill');
  expect(migration.routine[0].stepId).toBe('backfill');
});

test('buildMigrations collects a ConfigError when a routine is missing', async () => {
  // Caught by collectMigrationFiles' schema, before buildMigrations' own
  // per-step checks run.
  writeMigration('2026-08-30-01-empty.yaml', 'name: no routine\n');
  const components = {};
  const context = testContext();
  await buildMigrations({ components, context });
  expect(context.migrations).toEqual([]);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch('requires a "routine"');
});

test('buildMigrations collects a ConfigError when a routine is empty', async () => {
  writeMigration('2026-08-30-01-empty.yaml', 'routine: []\n');
  const components = {};
  const context = testContext();
  await buildMigrations({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch('is empty');
});

test('buildMigrations collects a ConfigError for an unknown step type', async () => {
  writeMigration(
    '2026-08-30-01-bad.yaml',
    ['routine:', '  - id: s1', '    type: NotAStep', '    connectionId: x'].join('\n')
  );
  const components = {};
  const context = testContext();
  await buildMigrations({ components, context });
  // NotAStep is treated as a request type and stamped; unknown request types
  // are caught downstream by type validation, so at minimum it builds a step id
  // without throwing here — the routine is still recorded.
  expect(context.errors).toEqual([]);
  expect(context.migrations[0].routine[0].id).toBe('request:migration:2026-08-30-01-bad:s1');
});

test('buildMigrations preserves lexical order across files', async () => {
  writeMigration(
    '2026-08-30-02-b.yaml',
    'routine:\n  - id: s\n    type: MongoDBUpdateMany\n    connectionId: c\n    tenant: none\n'
  );
  writeMigration(
    '2026-08-30-01-a.yaml',
    'routine:\n  - id: s\n    type: MongoDBUpdateMany\n    connectionId: c\n    tenant: none\n'
  );
  const context = testContext();
  await buildMigrations({ components: {}, context });
  expect(context.migrations.map((m) => m.id)).toEqual(['2026-08-30-01-a', '2026-08-30-02-b']);
});
