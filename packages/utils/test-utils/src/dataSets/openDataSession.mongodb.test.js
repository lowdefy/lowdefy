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
import { vi, afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { Decimal128, MongoClient, ObjectId } from 'mongodb';
import { parseDataSet } from '@lowdefy/node-utils';

import addPauseGate from './addPauseGate.js';
import applyDataSetRedirect from './applyDataSetRedirect.js';
import holdAtPauseGate from './holdAtPauseGate.js';
import { dropIdleDatabases } from './idleDatabases.js';
import dataSessionRegistry from './dataSessionRegistry.js';
import findSessionDocuments from './findSessionDocuments.js';
import getDataStore from './getDataStore.js';
import openDataSession from './openDataSession.js';
import readDataSet from './readDataSet.js';

const mockLogger = { info: vi.fn(), warn: vi.fn() };

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

let store;
let client;

beforeAll(async () => {
  store = await getDataStore({ logger: mockLogger });
  client = new MongoClient(store.uri);
  await client.connect();
});

// Each test starts with no idle databases, so none reuses another's.
afterEach(async () => {
  await dropIdleDatabases({ store });
});

afterAll(async () => {
  await client.close();
  await store.stop();
});

function makeDataSet(overrides) {
  return {
    name: 'sample',
    fixtures: {},
    generated: {},
    indexes: {},
    users: {},
    collections: {},
    ...overrides,
  };
}

function sessionDb(session) {
  return client.db(session.databaseName);
}

async function listDatabaseNames() {
  const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
  return databases.map((database) => database.name);
}

test('openDataSession creates indexes before documents, so a fixture duplicating a unique key fails naming both', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    indexes: { tickets: [{ key: { number: 1 }, name: 'number_1', unique: true }] },
    fixtures: {
      tickets: [
        { _id: 'f0', number: 7 },
        { _id: 'f1', number: 7 },
      ],
    },
  });
  await expect(openDataSession({ dataSet, logger: mockLogger })).rejects.toThrow(
    'Data set "sample" fixture tickets[1] breaks unique index "number_1": duplicate key {"number":7} held by document _id "f0".'
  );
  expect([...dataSessionRegistry.values()].filter((s) => s.name === 'sample')).toEqual([]);
});

test('openDataSession drops expireAfterSeconds, creates a text index and lets a later index replace one with the same key', async () => {
  const dataSet = makeDataSet({
    collections: { events: 'events', 'events-archive': 'events' },
    fixtures: {
      events: [{ _id: 'e1', title: 'hello', created: { '~d': '2000-01-01T00:00:00.000Z' } }],
    },
    indexes: {
      events: [
        { key: { created: 1 }, name: 'created_ttl', expireAfterSeconds: 60 },
        {
          key: { _fts: 'text', _ftsx: 1 },
          name: 'title_text',
          weights: { title: 1 },
          default_language: 'english',
          language_override: 'language',
          textIndexVersion: 3,
        },
        { key: { organizationId: 1 }, name: 'org_1' },
      ],
      'events-archive': [{ key: { organizationId: 1 }, name: 'org_unique', unique: true }],
    },
  });
  const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
  try {
    const indexes = await sessionDb(session).collection('events').indexes();
    const byName = Object.fromEntries(indexes.map((index) => [index.name, index]));
    expect(byName.created_ttl.expireAfterSeconds).toBeUndefined();
    expect(byName.title_text.weights).toEqual({ title: 1 });
    expect(byName.org_1).toBeUndefined();
    expect(byName.org_unique.unique).toBe(true);
    const found = await sessionDb(session)
      .collection('events')
      .find({ $text: { $search: 'hello' } })
      .toArray();
    expect(found.map((document) => document._id)).toEqual(['e1']);
  } finally {
    await close();
  }
});

test('openDataSession lets a later fixture replace one with the same _id and revives dates, ObjectIds and decimals', async () => {
  const oid = new ObjectId();
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets', 'tickets-archive': 'tickets' },
    fixtures: {
      tickets: [
        { _id: 't1', title: 'first' },
        { _id: 't1', title: 'from fixture' },
      ],
      'tickets-archive': [
        {
          title: 'no id',
          due: { '~d': '2026-01-02T00:00:00.000Z' },
          ref: { _oid: oid.toHexString() },
          amount: { '~dec': '0.1' },
          big: { '~dec': '-1234567890123456789012345678901234' },
        },
      ],
    },
  });
  const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
  try {
    const tickets = sessionDb(session).collection('tickets');
    expect(await tickets.findOne({ _id: 't1' })).toEqual({ _id: 't1', title: 'from fixture' });
    const noId = await tickets.findOne({ title: 'no id' });
    expect(noId.due).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    expect(noId.ref).toEqual(oid);
    expect(noId.amount).toBeInstanceOf(Decimal128);
    expect(noId.amount.toString()).toEqual('0.1');
    expect(noId.big.toString()).toEqual('-1234567890123456789012345678901234');
    const [summed] = await tickets
      .aggregate([
        { $match: { title: 'no id' } },
        {
          $project: {
            _id: 0,
            type: { $type: '$amount' },
            sum: { $add: ['$amount', Decimal128.fromString('0.2')] },
          },
        },
      ])
      .toArray();
    expect(summed.type).toEqual('decimal');
    expect(summed.sum.toString()).toEqual('0.3');
    expect(await tickets.countDocuments()).toBe(2);
  } finally {
    await close();
  }
});

test('findSessionDocuments matches a fixture decimal by its ~dec marker and reads it back as one', async () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'find-session-decimals-'));
  fs.mkdirSync(path.join(buildDirectory, 'connections'));
  const dataSet = makeDataSet({
    collections: { invoices: 'invoices' },
    fixtures: {
      invoices: [
        { _id: 'i1', total: { '~dec': '0.30' } },
        { _id: 'i2', total: { '~dec': '12.50' } },
        { _id: 'i3', total: '0.30' },
      ],
    },
  });
  const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
  try {
    const documents = await findSessionDocuments({
      buildDirectory,
      client,
      collection: 'invoices',
      match: { total: { '~dec': '0.3' } },
      session,
    });
    // MongoDB compares decimals by value, so '0.3' matches the stored 0.30 and not the string.
    expect(documents).toEqual([{ _id: 'i1', total: { '~dec': '0.30' } }]);
  } finally {
    await close();
    fs.rmSync(buildDirectory, { recursive: true, force: true });
  }
});

test('openDataSession loads fixtures and generated documents together, with generated dates as Dates', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-generate-'));
  try {
    fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(configDirectory, 'tests', 'data', 'invoices.yaml'),
      [
        'fixtures:',
        '  customers_db:',
        '    - { _id: c-fixture, name: Fixture customer }',
        'generate:',
        '  seed: 7',
        '  customers_db:',
        '    count: 4',
        '    fields:',
        '      name: { company: true }',
        '  invoices_db:',
        '    count: 30',
        '    fields:',
        '      _id: { sequence: { prefix: inv-, start: 1 } }',
        '      status: { oneOf: [draft, sent, paid], weights: [1, 2, 5] }',
        '      issued: { date: { from: 2026-01-01, to: 2026-09-30 } }',
        '      customerId: { ref: customers_db }',
        '',
      ].join('\n')
    );
    const parsed = await parseDataSet({ configDirectory, name: 'invoices' });
    const dataSet = makeDataSet({
      ...parsed,
      name: 'sample',
      collections: { customers_db: 'customers', invoices_db: 'invoices' },
    });
    const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
    try {
      const customers = await sessionDb(session)
        .collection('customers')
        .find({})
        .sort({ _id: 1 })
        .toArray();
      expect(customers.map(({ _id }) => _id)).toEqual([
        'c-fixture',
        'customers_db-1',
        'customers_db-2',
        'customers_db-3',
        'customers_db-4',
      ]);
      const invoices = await sessionDb(session).collection('invoices').find({}).toArray();
      expect(invoices).toHaveLength(30);
      expect(invoices[0]._id).toEqual('inv-1');
      expect(invoices[0].issued).toBeInstanceOf(Date);
      const customerIds = customers.map(({ _id }) => _id);
      invoices.forEach((invoice) => expect(customerIds).toContain(invoice.customerId));
      expect(
        await sessionDb(session).collection('invoices').countDocuments({ status: 'paid' })
      ).toEqual(parsed.generated.invoices_db.filter(({ status }) => status === 'paid').length);
    } finally {
      await close();
    }
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  }
});

test('openDataSession fails naming the generated document that breaks a unique index', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    indexes: { tickets: [{ key: { status: 1 }, name: 'status_1', unique: true }] },
    generated: {
      tickets: [
        { _id: 'g1', status: 'open' },
        { _id: 'g2', status: 'closed' },
        { _id: 'g3', status: 'open' },
      ],
    },
  });
  await expect(openDataSession({ dataSet, logger: mockLogger })).rejects.toThrow(
    'Data set "sample" generated tickets[2] (_id "g3") breaks unique index "status_1": duplicate key { status: "open" }.'
  );
});

test('a session database runs a transaction and opens a change stream', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    fixtures: { tickets: [{ _id: 't1' }] },
  });
  const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
  const sessionClient = new MongoClient(session.databaseUri);
  await sessionClient.connect();
  try {
    const tickets = sessionClient.db(session.databaseName).collection('tickets');
    const stream = tickets.watch();
    const next = stream.next();
    const mongoSession = sessionClient.startSession();
    await mongoSession.withTransaction(async () => {
      await tickets.insertOne({ _id: 't2' }, { session: mongoSession });
    });
    await mongoSession.endSession();
    const change = await next;
    expect(change.documentKey).toEqual({ _id: 't2' });
    await stream.close();
    expect(await tickets.countDocuments()).toBe(2);
  } finally {
    await sessionClient.close();
    await close();
  }
});

test('two sessions on one data set are isolated, and close() keeps the databases until the idle ones are dropped', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    fixtures: { tickets: [{ _id: 't1' }] },
  });
  const first = await openDataSession({ dataSet, logger: mockLogger });
  const second = await openDataSession({ dataSet, logger: mockLogger });
  expect(first.session.databaseName).not.toEqual(second.session.databaseName);
  await sessionDb(first.session).collection('tickets').insertOne({ _id: 'written' });
  expect(await sessionDb(second.session).collection('tickets').countDocuments()).toBe(1);
  await first.close();
  await second.close();
  expect(first.session.state).toEqual('closed');
  expect(dataSessionRegistry.has(first.id)).toBe(false);
  expect(await listDatabaseNames()).toEqual(
    expect.arrayContaining([first.session.databaseName, second.session.databaseName])
  );
  await dropIdleDatabases({ store });
  const names = await listDatabaseNames();
  expect(names).not.toContain(first.session.databaseName);
  expect(names).not.toContain(second.session.databaseName);
});

describe('two databases that name one collection', () => {
  let configDirectory;
  let buildDirectory;

  const artifacts = {
    app_users: {
      connectionId: 'app_users',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'MONGODB_URI' }, collection: 'users' },
    },
    auth_users: {
      connectionId: 'auth_users',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'AUTH_MONGODB_URI' }, collection: 'users' },
    },
  };

  beforeEach(() => {
    configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-targets-'));
    buildDirectory = path.join(configDirectory, '.lowdefy', 'dev', 'build');
    fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
    fs.mkdirSync(path.join(buildDirectory, 'connections'), { recursive: true });
    Object.values(artifacts).forEach((artifact) => {
      fs.writeFileSync(
        path.join(buildDirectory, 'connections', `${artifact.connectionId}.json`),
        JSON.stringify(artifact)
      );
    });
    fs.writeFileSync(
      path.join(configDirectory, 'tests', 'data', 'targets.yaml'),
      `fixtures:
  app_users: [{ _id: shared, name: App member }]
  auth_users: [{ _id: shared, name: Auth user }, { _id: auth-only }]
indexes:
  app_users: [{ key: { name: 1 }, name: name_1, unique: true }]
`
    );
  });

  afterEach(() => {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  });

  // The database a request on the connection reads under the session, through the gate.
  async function redirectedDb({ session, connectionId }) {
    const context = {
      readConfigFile: async (filePath) =>
        artifacts[filePath.replace(/^connections\/(.+)\.json$/, '$1')] ?? null,
    };
    applyDataSetRedirect({
      context,
      session,
      connections: { MongoDBCollection: { meta: { dataSet: 'redirect' } } },
    });
    const { properties } = await context.readConfigFile(`connections/${connectionId}.json`);
    expect(properties.databaseUri).toEqual(session.databaseUri);
    return client.db(properties.databaseName);
  }

  test('each databaseUri secret loads into and reads its own session database, and both drop with the idle databases', async () => {
    const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'targets' });
    const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
    let names;
    try {
      const appDb = await redirectedDb({ session, connectionId: 'app_users' });
      const authDb = await redirectedDb({ session, connectionId: 'auth_users' });
      expect(appDb.databaseName).not.toEqual(authDb.databaseName);
      names = [appDb.databaseName, authDb.databaseName];
      names.forEach((name) => expect(name.startsWith(`${session.prefix}_`)).toBe(true));
      expect(await appDb.collection('users').find().toArray()).toEqual([
        { _id: 'shared', name: 'App member' },
      ]);
      expect(await authDb.collection('users').find().sort({ _id: 1 }).toArray()).toEqual([
        { _id: 'auth-only' },
        { _id: 'shared', name: 'Auth user' },
      ]);
      // Indexes load per target too.
      const appIndexes = await appDb.collection('users').indexes();
      const authIndexes = await authDb.collection('users').indexes();
      expect(appIndexes.map((index) => index.name)).toContain('name_1');
      expect(authIndexes.map((index) => index.name)).not.toContain('name_1');
      expect(await listDatabaseNames()).toEqual(expect.arrayContaining(names));
    } finally {
      await close();
    }
    await dropIdleDatabases({ store });
    const left = await listDatabaseNames();
    names.forEach((name) => expect(left).not.toContain(name));
  });

  test('a connection whose target is computed loads into the first target database with it', async () => {
    artifacts.computed_users = {
      connectionId: 'computed_users',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _env: 'URI' }, collection: 'users' },
    };
    fs.writeFileSync(
      path.join(buildDirectory, 'connections', 'computed_users.json'),
      JSON.stringify(artifacts.computed_users)
    );
    fs.writeFileSync(
      path.join(configDirectory, 'tests', 'data', 'computed.yaml'),
      'fixtures:\n  auth_users: [{ _id: auth }]\n  computed_users: [{ _id: computed }]\n'
    );
    try {
      const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'computed' });
      const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
      try {
        // AUTH_MONGODB_URI sorts first, so its database is the session's first.
        const authDb = await redirectedDb({ session, connectionId: 'auth_users' });
        const computedDb = await redirectedDb({ session, connectionId: 'computed_users' });
        expect(authDb.databaseName).toEqual(session.databaseName);
        expect(computedDb.databaseName).toEqual(session.databaseName);
        const ids = await authDb.collection('users').distinct('_id');
        expect(ids.sort()).toEqual(['auth', 'computed']);
      } finally {
        await close();
      }
    } finally {
      delete artifacts.computed_users;
    }
  });

  test('a session database the gate numbers after open survives a concurrent sweep, is emptied when the next session reuses it, and drops with the idle databases', async () => {
    const dataSet = await readDataSet({ configDirectory, buildDirectory, name: 'targets' });
    const first = await openDataSession({ dataSet, logger: mockLogger });
    // A target the build did not name, as a config mutant's would be.
    artifacts.late = {
      connectionId: 'late',
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'LATE_URI' }, collection: 'users' },
    };
    let lateName;
    try {
      const db = await redirectedDb({ session: first.session, connectionId: 'late' });
      await db.collection('users').insertOne({ _id: 'late' });
      lateName = db.databaseName;
    } finally {
      delete artifacts.late;
    }
    expect(lateName).toEqual(`${first.session.prefix}_${dataSet.databaseTargets.length}`);
    const second = await openDataSession({ dataSet, logger: mockLogger });
    expect(await listDatabaseNames()).toContain(lateName);
    await second.close();
    await first.close();
    expect(await listDatabaseNames()).toContain(lateName);
    // Two idle sets: one of them is the first session's, with the late target in it.
    const third = await openDataSession({ dataSet, logger: mockLogger });
    const fourth = await openDataSession({ dataSet, logger: mockLogger });
    const reused = [third, fourth].find(({ session }) => session.prefix === first.session.prefix);
    expect([...reused.session.databases.values()]).toContain(lateName);
    expect(await client.db(lateName).collection('users').countDocuments()).toBe(0);
    await third.close();
    await fourth.close();
    await dropIdleDatabases({ store });
    expect(await listDatabaseNames()).not.toContain(lateName);
  });
});

test('close() waits for background work added to the session', async () => {
  const { session, close } = await openDataSession({
    dataSet: makeDataSet({}),
    logger: mockLogger,
  });
  let release;
  const work = new Promise((resolve) => {
    release = resolve;
  });
  session.work.add(work);
  work.then(() => session.work.delete(work));
  let closed = false;
  const closing = close().then(() => {
    closed = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(closed).toBe(false);
  expect(session.state).toEqual('closing');
  release();
  await closing;
  expect(closed).toBe(true);
});

test('close() lets go of a routine held at a pause gate and removes the gates', async () => {
  const { session, close } = await openDataSession({
    dataSet: makeDataSet({}),
    logger: mockLogger,
  });
  addPauseGate({ requestId: 'claim_run', session });
  addPauseGate({ requestId: 'read_run', session });
  const held = holdAtPauseGate({ args: { requestId: 'claim_run' }, session });
  await close();
  await held;
  expect(session.pauseGates).toEqual([]);
});

test('close() drops after 30 s with a warning when background work never settles', async () => {
  const { session, close } = await openDataSession({
    dataSet: makeDataSet({}),
    logger: mockLogger,
  });
  await sessionDb(session).collection('kept').insertOne({ _id: 1 });
  const warn = mockLogger.warn;
  warn.mockClear();
  session.work.add(new Promise(() => {}));
  vi.useFakeTimers({
    toFake: [
      'Date',
      'hrtime',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
  let warnings;
  try {
    const closing = close();
    vi.advanceTimersByTime(30000);
    vi.useRealTimers();
    await closing;
    warnings = warn.mock.calls.map(([message]) => message);
  } finally {
    vi.useRealTimers();
    warn.mockRestore();
  }
  expect(warnings).toEqual([expect.stringContaining('Data set "sample"')]);
  expect(session.state).toEqual('closed');
  expect(await listDatabaseNames()).not.toContain(session.databaseName);
});

test('openDataSession sweeps an ld_ database no open session owns', async () => {
  await client.db('ld_orphan00000').collection('left').insertOne({ _id: 1 });
  await client.db('not_a_session').collection('kept').insertOne({ _id: 1 });
  const { close } = await openDataSession({ dataSet: makeDataSet({}), logger: mockLogger });
  const names = await listDatabaseNames();
  expect(names).not.toContain('ld_orphan00000');
  expect(names).toContain('not_a_session');
  await close();
  await client.db('not_a_session').dropDatabase();
});

test('openDataSession writes generated documents before fixtures, so a fixture replaces a generated document with its _id', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets', 'tickets-archive': 'tickets' },
    generated: {
      tickets: [
        { _id: 'g1', title: 'generated' },
        { _id: 'g2', title: 'generated' },
      ],
    },
    fixtures: {
      tickets: [{ _id: 'g2', title: 'fixture' }],
      'tickets-archive': [{ title: 'no id' }],
    },
  });
  const { session, close } = await openDataSession({ dataSet, logger: mockLogger });
  try {
    const found = await sessionDb(session).collection('tickets').find({}).toArray();
    expect(found.map(({ title }) => title).sort()).toEqual(['fixture', 'generated', 'no id']);
    expect(found.find((document) => document._id === 'g2').title).toEqual('fixture');
  } finally {
    await close();
  }
});

describe('a closed session keeps its databases for the next session on its data set', () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets', 'tickets-archive': 'tickets' },
    indexes: { tickets: [{ key: { number: 1 }, name: 'number_1', unique: true }] },
    generated: { 'tickets-archive': [{ _id: 'g1', number: 100 }] },
    fixtures: {
      tickets: [
        { _id: 't1', number: 1, stage: 'open' },
        { _id: 't2', number: 2, stage: 'open' },
      ],
    },
  });

  async function describeDatabase(session) {
    const db = sessionDb(session);
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = collections
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();
    const described = {};
    for (const name of names) {
      described[name] = {
        documents: await db.collection(name).find({}).sort({ _id: 1 }).toArray(),
        indexes: (await db.collection(name).indexes()).map((index) => index.name).sort(),
      };
    }
    return described;
  }

  test('the next session reuses them and starts from exactly the data set, whatever the last one wrote', async () => {
    const first = await openDataSession({ dataSet, logger: mockLogger });
    const loaded = await describeDatabase(first.session);
    expect(Object.keys(loaded)).toEqual(['tickets']);
    expect(loaded.tickets.indexes).toEqual(['_id_', 'number_1']);

    const db = sessionDb(first.session);
    const tickets = db.collection('tickets');
    await tickets.updateOne({ _id: 't1' }, { $set: { stage: 'closed' } });
    await tickets.deleteOne({ _id: 't2' });
    await tickets.insertOne({ _id: 't3', number: 3 });
    await tickets.createIndex({ stage: 1 }, { name: 'stage_1' });
    // A consecutive id counts on from the documents there, so a leftover one would move it on.
    await db.collection('counters').insertOne({ _id: 'INV-7' });
    await db.collection('members').createIndex({ userId: 1 }, { unique: true });
    await db.createCollection('open_tickets', { viewOn: 'tickets', pipeline: [] });
    await first.close();

    const second = await openDataSession({ dataSet, logger: mockLogger });
    try {
      expect(second.session.prefix).toEqual(first.session.prefix);
      expect(second.id).not.toEqual(first.id);
      expect(second.cookie).not.toEqual(first.cookie);
      expect(dataSessionRegistry.has(first.id)).toBe(false);
      expect(dataSessionRegistry.get(second.id)).toBe(second.session);
      const reset = await describeDatabase(second.session);
      // A collection the last session wrote stays, empty, when it kept the _id index alone.
      expect(reset).toEqual({ ...loaded, counters: { documents: [], indexes: ['_id_'] } });
    } finally {
      await second.close();
    }
  });

  test('two sessions open at once never share databases, and a third waits for neither', async () => {
    const [first, second] = await Promise.all([
      openDataSession({ dataSet, logger: mockLogger }),
      openDataSession({ dataSet, logger: mockLogger }),
    ]);
    expect(first.session.prefix).not.toEqual(second.session.prefix);
    await first.close();
    const third = await openDataSession({ dataSet, logger: mockLogger });
    const fourth = await openDataSession({ dataSet, logger: mockLogger });
    expect(third.session.prefix).toEqual(first.session.prefix);
    expect([first.session.prefix, second.session.prefix]).not.toContain(fourth.session.prefix);
    await Promise.all([second.close(), third.close(), fourth.close()]);
  });

  test('an orphan sweep leaves them', async () => {
    const first = await openDataSession({ dataSet, logger: mockLogger });
    await first.close();
    const other = await openDataSession({
      dataSet: makeDataSet({ name: 'other' }),
      logger: mockLogger,
    });
    await other.close();
    expect(await listDatabaseNames()).toContain(first.session.databaseName);
  });

  test('a data set whose indexes changed since drops them and loads a new set', async () => {
    const first = await openDataSession({ dataSet, logger: mockLogger });
    await first.close();
    const edited = {
      ...dataSet,
      indexes: { tickets: [{ key: { stage: 1 }, name: 'stage_1' }] },
    };
    const second = await openDataSession({ dataSet: edited, logger: mockLogger });
    try {
      expect(second.session.prefix).not.toEqual(first.session.prefix);
      expect(await listDatabaseNames()).not.toContain(first.session.databaseName);
      const indexes = await sessionDb(second.session).collection('tickets').indexes();
      expect(indexes.map((index) => index.name).sort()).toEqual(['_id_', 'stage_1']);
    } finally {
      await second.close();
    }
  });

  test('the next session reads the data set it is given, so an edit to the documents shows', async () => {
    const first = await openDataSession({ dataSet, logger: mockLogger });
    await first.close();
    const edited = {
      ...dataSet,
      fixtures: { tickets: [{ _id: 't9', number: 9 }] },
    };
    const second = await openDataSession({ dataSet: edited, logger: mockLogger });
    try {
      expect(second.session.prefix).toEqual(first.session.prefix);
      const ids = await sessionDb(second.session).collection('tickets').distinct('_id');
      expect(ids.sort()).toEqual(['g1', 't9']);
    } finally {
      await second.close();
    }
  });
});
