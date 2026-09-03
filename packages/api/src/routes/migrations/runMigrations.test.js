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
import runMigrations from './runMigrations.js';

function testContext() {
  const logs = { info: [], warn: [], error: [] };
  return {
    logs,
    rid: 'test-rid',
    appMeta: { version: '8.0.0' },
    config: {},
    configDirectory: '/app',
    // Pre-set so runMigrations does not build a real evaluateOperators.
    evaluateOperators: () => ({}),
    logger: {
      info: (msg) => logs.info.push(String(msg)),
      warn: (msg) => logs.warn.push(String(msg)),
      error: (_, msg) => logs.error.push(String(msg)),
      debug: () => {},
    },
  };
}

function fakeLedger({ applied = [] } = {}) {
  const writes = [];
  return {
    writes,
    path: '/app/.lowdefy/migrations/prod.json',
    read: async () => applied,
    write: async (entries) => {
      writes.push(entries);
    },
  };
}

const index = {
  stage: 'prod',
  migrations: [
    { id: 'm1', checksum: 'a1', applied: false },
    { id: 'm2', checksum: 'b2', applied: false },
  ],
};

function run(context, { options = {}, deps = {} } = {}) {
  return runMigrations(context, {
    options: { stage: 'prod', runner: 'tester', ...options },
    deps: {
      readIndex: async () => index,
      describeTargets: async () => [],
      ...deps,
    },
  });
}

test('runMigrations applies every pending migration in order and rewrites the ledger after each', async () => {
  const ledger = fakeLedger();
  const ran = [];
  const result = await run(testContext(), {
    deps: {
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 5 };
      },
    },
  });
  expect(ran).toEqual(['m1', 'm2']);
  expect(ledger.writes).toHaveLength(2);
  expect(ledger.writes[0].map((e) => e.id)).toEqual(['m1']);
  expect(ledger.writes[1].map((e) => e.id)).toEqual(['m1', 'm2']);
  expect(ledger.writes[1][0]).toMatchObject({
    checksum: 'a1',
    documents: 5,
    lowdefyVersion: '8.0.0',
    runner: 'tester',
  });
  expect(typeof ledger.writes[1][0].appliedAt).toBe('string');
  expect(result.applied.map((a) => a.id)).toEqual(['m1', 'm2']);
  expect(result.failed).toBeNull();
  expect(result.stage).toBe('prod');
  expect(result.ledgerPath).toBe('/app/.lowdefy/migrations/prod.json');
});

test('runMigrations skips migrations the ledger records and keeps their entries', async () => {
  const ledger = fakeLedger({ applied: [{ id: 'm1', checksum: 'a1', runner: 'ci' }] });
  const ran = [];
  await run(testContext(), {
    deps: {
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 0 };
      },
    },
  });
  expect(ran).toEqual(['m2']);
  expect(ledger.writes[0].map((e) => e.id)).toEqual(['m1', 'm2']);
  expect(ledger.writes[0][0].runner).toBe('ci');
});

test('runMigrations writes nothing when there are no pending migrations', async () => {
  const ledger = fakeLedger({
    applied: [
      { id: 'm1', checksum: 'a1' },
      { id: 'm2', checksum: 'b2' },
    ],
  });
  const result = await run(testContext(), {
    deps: { ledger, runMigration: async () => ({ status: 'continue' }) },
  });
  expect(ledger.writes).toEqual([]);
  expect(result.applied).toEqual([]);
  expect(result.pending).toEqual([]);
});

test('runMigrations stops at a failing migration and leaves its ledger entry absent', async () => {
  const ledger = fakeLedger();
  const ran = [];
  const context = testContext();
  const result = await run(context, {
    deps: {
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        if (migration.id === 'm1') {
          return { status: 'error', error: new Error('boom'), documents: 0 };
        }
        return { status: 'continue', documents: 1 };
      },
    },
  });
  expect(ran).toEqual(['m1']);
  expect(ledger.writes).toEqual([]);
  expect(result.applied).toEqual([]);
  expect(result.failed).toEqual({ id: 'm1', message: 'boom' });
  expect(context.logs.error.join(' ')).toMatch('Migration "m1" failed');
});

test('runMigrations --dry-run plans, describes targets, and writes nothing', async () => {
  const ledger = fakeLedger();
  const targets = [{ connectionId: 'things', type: 'MongoDBCollection', database: 'app' }];
  const result = await run(testContext(), {
    options: { dryRun: true },
    deps: {
      ledger,
      describeTargets: async (pending) => {
        expect(pending.map((m) => m.id)).toEqual(['m1', 'm2']);
        return targets;
      },
      runMigration: async () => {
        throw new Error('must not run');
      },
    },
  });
  expect(result.dryRun).toBe(true);
  expect(result.pending).toEqual(['m1', 'm2']);
  expect(result.targets).toEqual(targets);
  expect(ledger.writes).toEqual([]);
});

test('runMigrations --to limits the run', async () => {
  const ledger = fakeLedger();
  const ran = [];
  await run(testContext(), {
    options: { to: 'm1' },
    deps: {
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 0 };
      },
    },
  });
  expect(ran).toEqual(['m1']);
});

test('runMigrations refuses a checksum mismatch by default', async () => {
  const ledger = fakeLedger({ applied: [{ id: 'm1', checksum: 'OLD' }] });
  await expect(
    run(testContext(), { deps: { ledger, runMigration: async () => ({ status: 'continue' }) } })
  ).rejects.toThrow('have changed since they were applied to stage "prod"');
  expect(ledger.writes).toEqual([]);
});

test('runMigrations --allow-checksum-mismatch rewrites the ledger checksum and continues', async () => {
  const ledger = fakeLedger({ applied: [{ id: 'm1', checksum: 'OLD', runner: 'ci' }] });
  const context = testContext();
  const ran = [];
  await run(context, {
    options: { allowChecksumMismatch: true },
    deps: {
      ledger,
      runMigration: async (migration) => {
        ran.push(migration.id);
        return { status: 'continue', documents: 0 };
      },
    },
  });
  expect(context.logs.warn.join(' ')).toMatch('Checksum mismatch on applied migration(s) "m1"');
  expect(ledger.writes[0]).toEqual([{ id: 'm1', checksum: 'a1', runner: 'ci' }]);
  expect(ran).toEqual(['m2']);
});

test('runMigrations warns about applied ledger ids with no file', async () => {
  const ledger = fakeLedger({
    applied: [
      { id: 'm1', checksum: 'a1' },
      { id: 'm2', checksum: 'b2' },
      { id: 'gone', checksum: 'zz' },
    ],
  });
  const context = testContext();
  const result = await run(context, {
    deps: { ledger, runMigration: async () => ({ status: 'continue' }) },
  });
  expect(result.missingFiles).toEqual(['gone']);
  expect(context.logs.warn.join(' ')).toMatch('Applied migration "gone" has no file');
});

test('runMigrations refuses when the build was made for another stage', async () => {
  await expect(
    run(testContext(), {
      options: { stage: 'sandbox' },
      deps: { ledger: fakeLedger(), runMigration: async () => ({ status: 'continue' }) },
    })
  ).rejects.toThrow(
    'The build was made for stage "prod" but "lowdefy migrate" is running for stage "sandbox"'
  );
});

test('runMigrations refuses without a stage', async () => {
  await expect(
    runMigrations(testContext(), { options: {}, deps: { readIndex: async () => index } })
  ).rejects.toThrow('requires a stage');
});

test('runMigrations refuses an index from an older build shape', async () => {
  await expect(
    run(testContext(), {
      deps: { readIndex: async () => [{ id: 'm1', checksum: 'a1' }], ledger: fakeLedger() },
    })
  ).rejects.toThrow('has no migrations index');
});
