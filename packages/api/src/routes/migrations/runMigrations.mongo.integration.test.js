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

/* Live-database integration test for the migrations runtime (design D2, D8,
   D9, D10): the ledger, the atomic advisory lock, the runner, and the serving
   preflight, all through the real MongoDBCollection request machinery against
   a real mongodb-memory-server — no mocked ledger. */

import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { MongoDBCollection } from '@lowdefy/connection-mongodb/connections';
import { operatorsServer } from '@lowdefy/operators-js';
import { ConfigError, ServiceError } from '@lowdefy/errors';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createMongoLedger, { LOCK_ID } from './createMongoLedger.js';
import resolveMigrationPreflight from '../connections/resolveMigrationPreflight.js';
import runMigrations from './runMigrations.js';
import runMigrationRoutine from './runMigrationRoutine.js';
import testContext from '../../test/testContext.js';

jest.setTimeout(120000);

let mongod;
let client;
let uri;
let dbCounter = 0;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await mongod.stop();
});

// Each scenario gets its own database so ledger state never leaks between tests.
function freshDb() {
  dbCounter += 1;
  return `migrations_it_${dbCounter}`;
}

function migrationStep({ migrationId, stepId, type, connectionId, properties }) {
  return {
    id: `request:migration:${migrationId}:${stepId}`,
    stepId,
    endpointId: `migration:${migrationId}`,
    type,
    connectionId,
    tenant: 'none',
    properties,
  };
}

// Two migrations in the shape buildMigrations writes: m1 backfills a field on
// the `things` collection, m2 inserts a marker document.
const M1 = '2026-01-01-01-backfill-active';
const M2 = '2026-01-01-02-insert-marker';

function buildFiles({ dbUri, index, artifacts }) {
  return {
    'migrations.json': index,
    'collections.json': {},
    'connections/migrations.json': {
      id: 'connection:migrations',
      type: 'MongoDBCollection',
      connectionId: 'migrations',
      properties: { databaseUri: dbUri, collection: 'migrations', write: true },
    },
    'connections/things.json': {
      id: 'connection:things',
      type: 'MongoDBCollection',
      connectionId: 'things',
      properties: { databaseUri: dbUri, collection: 'things', write: true },
    },
    ...artifacts,
  };
}

function makeContext({ dbUri, index, artifacts = {}, config = {}, rid, logger }) {
  const files = buildFiles({ dbUri, index, artifacts });
  const context = testContext({
    config,
    connections: { MongoDBCollection },
    logger,
    operators: { ...operatorsServer },
    readConfigFile: async (filePath) => files[filePath] ?? null,
    system: true,
  });
  context.rid = rid ?? 'it';
  context.appMeta = { version: '8.0.0-test' };
  return context;
}

function defaultArtifacts() {
  return {
    [`migrations/${M1}.json`]: {
      id: M1,
      checksum: 'c1',
      routine: [
        migrationStep({
          migrationId: M1,
          stepId: 'backfill',
          type: 'MongoDBUpdateMany',
          connectionId: 'things',
          properties: {
            filter: { active: { $exists: false } },
            update: { $set: { active: true } },
          },
        }),
      ],
    },
    [`migrations/${M2}.json`]: {
      id: M2,
      checksum: 'c2',
      routine: [
        migrationStep({
          migrationId: M2,
          stepId: 'marker',
          type: 'MongoDBInsertOne',
          connectionId: 'things',
          properties: { doc: { _id: 'marker', from: M2 } },
        }),
      ],
    },
  };
}

const defaultIndex = [
  { id: M1, checksum: 'c1' },
  { id: M2, checksum: 'c2' },
];

test('runMigrations plans, locks, applies in order, writes ledger rows, and releases the lock', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }]);

  const context = makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() });
  const result = await runMigrations(context, { options: {} });

  expect(result.applied.map((a) => a.id)).toEqual([M1, M2]);
  expect(result.failed).toBeNull();

  // The data moved.
  const things = await db.collection('things').find({ active: true }).toArray();
  expect(things.map((t) => t._id).sort()).toEqual(['a', 'b', 'c']);
  expect(await db.collection('things').findOne({ _id: 'marker' })).toMatchObject({ from: M2 });

  // One ledger row per migration, in the design's document shape, id as _id only.
  const rows = await db
    .collection('migrations')
    .find({ _id: { $ne: LOCK_ID } })
    .sort({ _id: 1 })
    .toArray();
  expect(rows.map((r) => r._id)).toEqual([M1, M2]);
  rows.forEach((row) => {
    expect(row.status).toBe('applied');
    expect(row.appliedAt).toBeInstanceOf(Date);
    expect(typeof row.durationMs).toBe('number');
    expect(row.id).toBeUndefined();
  });
  expect(rows[0].checksum).toBe('c1');
  // m1 backfilled 3 documents — counted once, not matched-plus-modified.
  expect(rows[0].documents).toBe(3);

  // The lock was released.
  expect(await db.collection('migrations').findOne({ _id: LOCK_ID })).toBeNull();

  // A second run has nothing to do and takes no lock.
  const again = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }),
    { options: {} }
  );
  expect(again.applied).toEqual([]);
  expect(await db.collection('migrations').countDocuments()).toBe(2);
});

test('two concurrent runs: exactly one wins the lock, each migration applies exactly once', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }]);

  function slowContextRun(rid) {
    const context = makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() });
    context.rid = rid;
    // Slow the real routine down so the two runs overlap while holding the lock.
    const deps = {
      runMigration: async (migration) => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return runMigrationRoutine(context, migration);
      },
    };
    return runMigrations(context, { options: {}, deps });
  }

  const [first, second] = await Promise.allSettled([slowContextRun('run-a'), slowContextRun('run-b')]);
  const outcomes = [first, second];
  const winners = outcomes.filter((o) => o.status === 'fulfilled');
  const losers = outcomes.filter((o) => o.status === 'rejected');
  expect(winners).toHaveLength(1);
  expect(losers).toHaveLength(1);
  expect(losers[0].reason).toBeInstanceOf(ConfigError);
  expect(losers[0].reason.message).toMatch(/migration lock is held/);
  expect(winners[0].value.applied.map((a) => a.id)).toEqual([M1, M2]);

  // Each migration applied exactly once — one marker insert, one ledger row each.
  expect(await db.collection('things').countDocuments({ _id: 'marker' })).toBe(1);
  const rows = await db
    .collection('migrations')
    .find({ _id: { $ne: LOCK_ID } })
    .toArray();
  expect(rows.map((r) => r._id).sort()).toEqual([M1, M2]);
  expect(await db.collection('migrations').findOne({ _id: LOCK_ID })).toBeNull();
});

test('a fresh foreign lock blocks the run and writes nothing; an expired lock is stolen with a warning', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }]);

  // Fresh foreign lock — hard stop naming the holder, ledger untouched.
  await db.collection('migrations').insertOne({
    _id: LOCK_ID,
    holder: 'other-host:123',
    acquiredAt: new Date(),
    expiresAt: new Date(Date.now() + 60000),
  });
  await expect(
    runMigrations(makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }), {
      options: {},
    })
  ).rejects.toThrow(/held by "other-host:123"/);
  expect(
    await db.collection('migrations').countDocuments({ _id: { $ne: LOCK_ID } })
  ).toBe(0);

  // Expired lock — stolen with a warning, run proceeds.
  await db
    .collection('migrations')
    .updateOne({ _id: LOCK_ID }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const warnings = [];
  const logger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: (msg) => warnings.push(String(msg)),
  };
  const result = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts(), logger }),
    { options: {} }
  );
  expect(result.applied.map((a) => a.id)).toEqual([M1, M2]);
  expect(warnings.join(' ')).toMatch(/Stole an expired migration lock held by "other-host:123"/);
  expect(await db.collection('migrations').findOne({ _id: LOCK_ID })).toBeNull();
});

test('acquireLock is atomic: N concurrent acquires yield exactly one winner', async () => {
  const dbName = freshDb();
  const dbUri = `${uri}${dbName}`;

  const attempts = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((n) => {
      const context = makeContext({ dbUri, index: [], artifacts: {} });
      // createMongoLedger calls handleRequest, which needs evaluateOperators —
      // runMigrations normally sets it; set it the same way here.
      context.evaluateOperators = createEvaluateOperators(context);
      const ledger = createMongoLedger(context, { connectionId: 'migrations' });
      return ledger.acquireLock({ holder: `racer-${n}` });
    })
  );
  const wins = attempts.filter((a) => a.status === 'fulfilled');
  const blocks = attempts.filter((a) => a.status === 'rejected');
  expect(wins).toHaveLength(1);
  expect(blocks).toHaveLength(4);
  blocks.forEach((b) => expect(b.reason.message).toMatch(/migration lock is held/));

  const lock = await client.db(dbName).collection('migrations').findOne({ _id: LOCK_ID });
  expect(lock.holder).toBe(wins[0].value.holder);
});

test('a failing migration stops the run, leaves its ledger entry absent, and releases the lock', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }]);

  const failingArtifacts = {
    ...defaultArtifacts(),
    [`migrations/${M2}.json`]: {
      id: M2,
      checksum: 'c2',
      routine: [
        migrationStep({
          migrationId: M2,
          stepId: 'boom',
          type: 'MongoDBUpdateOne',
          connectionId: 'things',
          // No matching row and no upsert — the resolver throws.
          properties: { filter: { _id: 'does-not-exist' }, update: { $set: { x: 1 } } },
        }),
      ],
    },
  };

  const result = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: failingArtifacts }),
    { options: {} }
  );
  expect(result.applied.map((a) => a.id)).toEqual([M1]);
  expect(result.failed.id).toBe(M2);
  expect(result.failed.message).toMatch(/No matching record to update/);

  const rows = await db
    .collection('migrations')
    .find({ _id: { $ne: LOCK_ID } })
    .toArray();
  expect(rows.map((r) => r._id)).toEqual([M1]);
  expect(await db.collection('migrations').findOne({ _id: LOCK_ID })).toBeNull();

  // The failed migration re-runs on the next invocation once fixed.
  const retry = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }),
    { options: {} }
  );
  expect(retry.applied.map((a) => a.id)).toEqual([M2]);
});

test('serving preflight refuses on pending migrations, retries while a run is in flight, serves once applied', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }]);

  // Pending migrations, no lock → memoized ConfigError refusal.
  const pendingConfig = { migrations: {} };
  const pendingContext = makeContext({
    dbUri,
    index: defaultIndex,
    artifacts: defaultArtifacts(),
    config: pendingConfig,
  });
  await expect(resolveMigrationPreflight(pendingContext)).rejects.toThrow(
    /2 migration\(s\) are pending/
  );
  // Memoized: the same refusal without re-probing (same config identity).
  await expect(resolveMigrationPreflight(pendingContext)).rejects.toThrow(ConfigError);

  // Lock held → retryable ServiceError, not memoized.
  await db.collection('migrations').insertOne({
    _id: LOCK_ID,
    holder: 'deployer:1',
    acquiredAt: new Date(),
    expiresAt: new Date(Date.now() + 60000),
  });
  const inFlightConfig = { migrations: {} };
  const inFlightContext = makeContext({
    dbUri,
    index: defaultIndex,
    artifacts: defaultArtifacts(),
    config: inFlightConfig,
  });
  await expect(resolveMigrationPreflight(inFlightContext)).rejects.toThrow(ServiceError);
  await db.collection('migrations').deleteOne({ _id: LOCK_ID });

  // The migration run finished — the SAME context retries (not memoized), but
  // migrations are still pending, so now it refuses.
  await expect(resolveMigrationPreflight(inFlightContext)).rejects.toThrow(
    /migration\(s\) are pending/
  );

  // Apply the migrations, then a fresh process (fresh config identity) serves.
  await runMigrations(makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }), {
    options: {},
  });
  const servedContext = makeContext({
    dbUri,
    index: defaultIndex,
    artifacts: defaultArtifacts(),
    config: { migrations: {} },
  });
  await expect(resolveMigrationPreflight(servedContext)).resolves.toBeUndefined();
});
