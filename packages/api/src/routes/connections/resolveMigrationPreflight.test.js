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
import { ConfigError } from '@lowdefy/errors';

import resolveMigrationPreflight from './resolveMigrationPreflight.js';

function testContext({ config, artifacts = {} }) {
  const warnings = [];
  const infos = [];
  return {
    warnings,
    infos,
    config,
    logger: {
      // pino's two-argument form: the event line and its message.
      info: (line, msg) => infos.push(msg ?? line),
      warn: (msg) => warnings.push(msg),
    },
    readConfigFile: async (filePath) => artifacts[filePath],
  };
}

test('resolveMigrationPreflight resolves without reading when preflight is opted out', async () => {
  const context = testContext({ config: { migrations: { preflight: false } } });
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
});

test('resolveMigrationPreflight resolves when the index lists no migrations', async () => {
  const context = testContext({
    config: {},
    artifacts: { 'migrations.json': { stage: 'prod', migrations: [] } },
  });
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
  expect(context.warnings).toEqual([]);
});

test('resolveMigrationPreflight warns and resolves when there is no index artifact (stale build)', async () => {
  const context = testContext({ config: {}, artifacts: {} });
  await resolveMigrationPreflight(context);
  expect(context.warnings.join(' ')).toMatch('Migration preflight skipped');
});

test('resolveMigrationPreflight warns and resolves on the pre-ledger array index shape', async () => {
  const context = testContext({ config: {}, artifacts: { 'migrations.json': [{ id: 'm1' }] } });
  await resolveMigrationPreflight(context);
  expect(context.warnings.join(' ')).toMatch('older lowdefy version');
});

test('resolveMigrationPreflight serves when every migration is recorded as applied', async () => {
  const context = testContext({
    config: {},
    artifacts: {
      'migrations.json': {
        stage: 'prod',
        migrations: [
          { id: 'm1', checksum: 'a', applied: true },
          { id: 'm2', checksum: 'b', applied: true },
        ],
      },
    },
  });
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
  expect(context.infos.join(' ')).toMatch('all 2 migration(s) applied to stage "prod"');
});

test('resolveMigrationPreflight logs a migrations_checked event naming the stage and migrations', async () => {
  const events = [];
  const context = {
    config: {},
    logger: { info: (line) => events.push(line), warn: () => {} },
    readConfigFile: async () => ({
      stage: 'prod',
      migrations: [
        { id: 'm1', checksum: 'a', applied: true },
        { id: 'm2', checksum: 'b', applied: true },
      ],
    }),
  };
  await resolveMigrationPreflight(context);
  expect(events).toEqual([
    { event: 'migrations_checked', stage: 'prod', migrations: ['m1', 'm2'] },
  ]);
});

test('resolveMigrationPreflight refuses with a memoized ConfigError naming the pending migrations and stage', async () => {
  const config = {};
  let reads = 0;
  const context = {
    config,
    logger: { info: () => {}, warn: () => {} },
    readConfigFile: async () => {
      reads += 1;
      return {
        stage: 'prod',
        migrations: [
          { id: 'm1', checksum: 'a', applied: true },
          { id: 'm2', checksum: 'b', applied: false },
          { id: 'm3', checksum: 'c', applied: false, ledgerChecksum: 'old' },
        ],
      };
    },
  };
  await expect(resolveMigrationPreflight(context)).rejects.toThrow(
    '2 migration(s) are not recorded as applied to stage "prod" — "m2", "m3". 1 of them ("m3") changed after being applied.'
  );
  await expect(resolveMigrationPreflight(context)).rejects.toThrow(ConfigError);
  expect(reads).toBe(1);
});

test('resolveMigrationPreflight retries after a failed artifact read', async () => {
  const config = {};
  let reads = 0;
  const context = {
    config,
    logger: { info: () => {}, warn: () => {} },
    readConfigFile: async () => {
      reads += 1;
      if (reads === 1) {
        throw new Error('disk hiccup');
      }
      return { stage: 'prod', migrations: [] };
    },
  };
  await expect(resolveMigrationPreflight(context)).rejects.toThrow('disk hiccup');
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
  expect(reads).toBe(2);
});
