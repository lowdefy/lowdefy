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

import { jest } from '@jest/globals';
import { MongoClient, ObjectId } from 'mongodb';

import dataSessionRegistry from './dataSessionRegistry.js';
import getDataStore from './getDataStore.js';
import openDataSession from './openDataSession.js';
import readDataSession from './readDataSession.js';
import { journeyActorToken } from '../../server/auth/journeyActor.js';

jest.setTimeout(120000);

let store;
let client;

beforeAll(async () => {
  store = await getDataStore();
  client = new MongoClient(store.uri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await store.stop();
});

function makeDataSet(overrides) {
  return {
    name: 'sample',
    fixtures: {},
    indexes: {},
    users: {},
    collections: {},
    ...overrides,
  };
}

function sessionDb(session) {
  return client.db(session.databaseName);
}

function cookieFor(id) {
  return `lowdefy_journey_data=${journeyActorToken}.${id}`;
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
  await expect(openDataSession({ dataSet })).rejects.toThrow(
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
  const { session, close } = await openDataSession({ dataSet });
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

test('openDataSession lets a later fixture replace one with the same _id and revives dates and ObjectIds', async () => {
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
        },
      ],
    },
  });
  const { session, close } = await openDataSession({ dataSet });
  try {
    const tickets = sessionDb(session).collection('tickets');
    expect(await tickets.findOne({ _id: 't1' })).toEqual({ _id: 't1', title: 'from fixture' });
    const noId = await tickets.findOne({ title: 'no id' });
    expect(noId.due).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    expect(noId.ref).toEqual(oid);
    expect(await tickets.countDocuments()).toBe(2);
  } finally {
    await close();
  }
});

test('a session database runs a transaction and opens a change stream', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    fixtures: { tickets: [{ _id: 't1' }] },
  });
  const { session, close } = await openDataSession({ dataSet });
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

test('two sessions on one data set are isolated, and close() drops the database', async () => {
  const dataSet = makeDataSet({
    collections: { tickets: 'tickets' },
    fixtures: { tickets: [{ _id: 't1' }] },
  });
  const first = await openDataSession({ dataSet });
  const second = await openDataSession({ dataSet });
  expect(first.session.databaseName).not.toEqual(second.session.databaseName);
  await sessionDb(first.session).collection('tickets').insertOne({ _id: 'written' });
  expect(await sessionDb(second.session).collection('tickets').countDocuments()).toBe(1);
  await first.close();
  await second.close();
  const names = await listDatabaseNames();
  expect(names).not.toContain(first.session.databaseName);
  expect(names).not.toContain(second.session.databaseName);
  expect(first.session.state).toEqual('closed');
});

test('close() waits for background work added to the session', async () => {
  const { session, close } = await openDataSession({ dataSet: makeDataSet({}) });
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

test('close() drops after 30 s with a warning when background work never settles', async () => {
  const { session, close } = await openDataSession({ dataSet: makeDataSet({}) });
  await sessionDb(session).collection('kept').insertOne({ _id: 1 });
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  session.work.add(new Promise(() => {}));
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask', 'performance'] });
  let warnings;
  try {
    const closing = close();
    jest.advanceTimersByTime(30000);
    jest.useRealTimers();
    await closing;
    warnings = warn.mock.calls.map(([message]) => message);
  } finally {
    jest.useRealTimers();
    warn.mockRestore();
  }
  expect(warnings).toEqual([expect.stringContaining('Data set "sample"')]);
  expect(session.state).toEqual('closed');
  expect(await listDatabaseNames()).not.toContain(session.databaseName);
});

test('openDataSession sweeps an ld_ database no open session owns', async () => {
  await client.db('ld_orphan00000').collection('left').insertOne({ _id: 1 });
  await client.db('not_a_session').collection('kept').insertOne({ _id: 1 });
  const { close } = await openDataSession({ dataSet: makeDataSet({}) });
  const names = await listDatabaseNames();
  expect(names).not.toContain('ld_orphan00000');
  expect(names).toContain('not_a_session');
  await close();
  await client.db('not_a_session').dropDatabase();
});

test('readDataSession returns the open session, and { ended } once it closes', async () => {
  const { id, cookie, session, close } = await openDataSession({ dataSet: makeDataSet({}) });
  expect(cookie).toEqual(id);
  expect(readDataSession(cookieFor(id))).toBe(session);
  await close();
  expect(readDataSession(cookieFor(id))).toEqual({ ended: id });
});
