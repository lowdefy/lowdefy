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
/* Live-database integration test for the migrations runtime (design D2, D10,
   D14): the runner applying real MongoDBCollection request steps against a
   real mongodb-memory-server, recording each migration in the per-stage
   ledger file — no mocked ledger, no mocked routine. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { operatorsServer } from '@lowdefy/operators-js';

// Imported from source rather than the package entry so this test shares the
// plugin's module-level MongoClient cache with closeClients, which the
// package entry does not export; without closing the cached clients the Jest
// worker never exits.
import { MongoDBCollection } from '../../../../plugins/connections/connection-mongodb/src/connections.js';
import { closeClients } from '../../../../plugins/connections/connection-mongodb/src/connections/MongoDBCollection/getClient.js';

import runMigrations from './runMigrations.js';
import testContext from '../../test/testContext.js';

jest.setTimeout(120000);

let mongod;
let client;
let uri;
let dbCounter = 0;
let configDirectory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
});

afterAll(async () => {
  await closeClients();
  await client.close();
  await mongod.stop();
});

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-migrations-it-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

// Each scenario gets its own database so data never leaks between tests.
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

function makeContext({ dbUri, index, artifacts, logger }) {
  const files = {
    'migrations.json': index,
    'collections.json': {},
    'connections/things.json': {
      id: 'connection:things',
      type: 'MongoDBCollection',
      connectionId: 'things',
      properties: { databaseUri: dbUri, collection: 'things', write: true },
    },
    ...artifacts,
  };
  const context = testContext({
    configDirectory,
    connections: { MongoDBCollection },
    logger,
    operators: { ...operatorsServer },
    readConfigFile: async (filePath) => files[filePath] ?? null,
    system: true,
  });
  context.rid = 'it';
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

const defaultIndex = {
  stage: 'test',
  migrations: [
    { id: M1, checksum: 'c1', applied: false },
    { id: M2, checksum: 'c2', applied: false },
  ],
};

function readLedgerFile() {
  return JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'migrations', 'test.json'), 'utf8')
  );
}

test('runMigrations applies in order through real MongoDB requests and records each in the ledger file', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }]);

  const context = makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() });
  const result = await runMigrations(context, { options: { stage: 'test', runner: 'it' } });

  expect(result.applied.map((a) => a.id)).toEqual([M1, M2]);
  expect(result.failed).toBeNull();
  // The plan named the connection and the database it resolved to.
  expect(result.targets).toEqual([
    { connectionId: 'things', type: 'MongoDBCollection', database: dbName },
  ]);

  // The data moved.
  const things = await db.collection('things').find({ active: true }).toArray();
  expect(things.map((t) => t._id).sort()).toEqual(['a', 'b', 'c']);
  expect(await db.collection('things').findOne({ _id: 'marker' })).toMatchObject({ from: M2 });

  // One ledger entry per migration, in the design's file shape.
  const ledger = readLedgerFile();
  expect(ledger.stage).toBe('test');
  expect(ledger.applied.map((e) => e.id)).toEqual([M1, M2]);
  ledger.applied.forEach((entry) => {
    expect(typeof entry.appliedAt).toBe('string');
    expect(typeof entry.durationMs).toBe('number');
    expect(entry.runner).toBe('it');
    expect(entry.lowdefyVersion).toBe('8.0.0-test');
  });
  expect(ledger.applied[0].checksum).toBe('c1');
  // m1 backfilled 3 documents — counted once, not matched-plus-modified.
  expect(ledger.applied[0].documents).toBe(3);

  // A second run reads the file and has nothing to do.
  const again = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }),
    { options: { stage: 'test', runner: 'it' } }
  );
  expect(again.applied).toEqual([]);
  expect(await db.collection('things').countDocuments({ _id: 'marker' })).toBe(1);
});

test('a failing migration stops the run, leaves its ledger entry absent, and re-runs once fixed', async () => {
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
    { options: { stage: 'test', runner: 'it' } }
  );
  expect(result.applied.map((a) => a.id)).toEqual([M1]);
  expect(result.failed.id).toBe(M2);
  expect(result.failed.message).toMatch(/No matching record to update/);
  expect(readLedgerFile().applied.map((e) => e.id)).toEqual([M1]);

  // The failed migration re-runs on the next invocation once fixed.
  const retry = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }),
    { options: { stage: 'test', runner: 'it' } }
  );
  expect(retry.applied.map((a) => a.id)).toEqual([M2]);
  expect(readLedgerFile().applied.map((e) => e.id)).toEqual([M1, M2]);
});

test('--dry-run names the targets and writes neither data nor ledger', async () => {
  const dbName = freshDb();
  const db = client.db(dbName);
  const dbUri = `${uri}${dbName}`;
  await db.collection('things').insertMany([{ _id: 'a' }]);

  const result = await runMigrations(
    makeContext({ dbUri, index: defaultIndex, artifacts: defaultArtifacts() }),
    { options: { stage: 'test', dryRun: true } }
  );
  expect(result.dryRun).toBe(true);
  expect(result.pending).toEqual([M1, M2]);
  expect(result.targets[0].database).toBe(dbName);
  expect(await db.collection('things').countDocuments({ active: true })).toBe(0);
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy'))).toBe(false);
});
