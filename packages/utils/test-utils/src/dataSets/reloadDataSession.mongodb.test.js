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

import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';

import getRunDataStore from './getRunDataStore.js';
import openDataSession from './openDataSession.js';
import reloadDataSession from './reloadDataSession.js';

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

const logger = { info: vi.fn(), warn: vi.fn() };

const targetA = JSON.stringify(['secret:A_URI', null]);
const targetB = JSON.stringify(['secret:B_URI', null]);

// Two connections on one collection in one database, and a third in a database of its own.
const dataSet = {
  name: 'sample',
  users: {},
  collections: { tickets: 'tickets', 'tickets-archive': 'tickets', audit: 'audit' },
  targets: { tickets: targetA, 'tickets-archive': targetA, audit: targetB },
  databaseTargets: [targetA, targetB],
  indexes: { tickets: [{ key: { number: 1 }, name: 'number_1', unique: true }] },
  fixtures: {
    tickets: [
      { _id: 't1', number: 1, stage: 'open' },
      { _id: 't2', number: 2, stage: 'open' },
    ],
    audit: [{ _id: 'a1', at: { '~d': '2026-01-01T00:00:00.000Z' } }],
  },
  generated: { 'tickets-archive': [{ _id: 'g1', number: 100 }] },
};

let store;
let opened;

beforeAll(async () => {
  store = await getRunDataStore({ logger });
});

afterEach(async () => {
  await opened.close();
});

afterAll(async () => {
  await store.stop();
});

function database(target) {
  return store.client.db(opened.session.databases.get(target));
}

async function readAll(collection) {
  return collection.find({}).sort({ _id: 1 }).toArray();
}

async function collectionNames(db) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  return collections.map((collection) => collection.name).sort();
}

test('reloadDataSession puts every collection back to the data set and drops one a test made, keeping indexes', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const tickets = database(targetA).collection('tickets');
  const audit = database(targetB).collection('audit');
  const before = { tickets: await readAll(tickets), audit: await readAll(audit) };
  expect(before.tickets.map((ticket) => ticket._id)).toEqual(['g1', 't1', 't2']);
  expect(before.audit[0].at).toBeInstanceOf(Date);

  await tickets.updateOne({ _id: 't1' }, { $set: { stage: 'closed' } });
  await tickets.deleteOne({ _id: 't2' });
  await tickets.insertOne({ _id: 't3', number: 3 });
  await audit.deleteMany({});
  await database(targetA).collection('scratch').insertOne({ _id: 's1' });

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  expect(await readAll(tickets)).toEqual(before.tickets);
  expect(await readAll(audit)).toEqual(before.audit);
  expect(await collectionNames(database(targetA))).toEqual(['tickets']);
  const indexes = await tickets.indexes();
  expect(indexes.find((index) => index.name === 'number_1').unique).toBe(true);
});

test('reloadDataSession loads a collection of the data set that was dropped, with its indexes', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const tickets = database(targetA).collection('tickets');
  await tickets.drop();

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  expect((await readAll(tickets)).map((ticket) => ticket._id)).toEqual(['g1', 't1', 't2']);
  await expect(tickets.insertOne({ _id: 't9', number: 1 })).rejects.toThrow('duplicate key');
});

test('reloadDataSession drops every collection of a session whose data set holds no documents', async () => {
  const empty = {
    ...dataSet,
    fixtures: {},
    generated: {},
    indexes: {},
    collections: {},
    targets: {},
  };
  opened = await openDataSession({ dataSet: empty, logger, store });
  await database(targetA).collection('tickets').insertOne({ _id: 't1' });
  await database(targetB).collection('audit').insertOne({ _id: 'a1' });

  await reloadDataSession({ client: store.client, dataSet: empty, session: opened.session });

  expect(await collectionNames(database(targetA))).toEqual([]);
  expect(await collectionNames(database(targetB))).toEqual([]);
});

test('reloadDataSession drops an index a test added to a data set collection, and loads the collection again with its own', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const tickets = database(targetA).collection('tickets');
  await tickets.deleteMany({});
  await tickets.createIndex({ stage: 1 }, { unique: true, name: 'stage_unique' });

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  const names = (await tickets.indexes()).map((index) => index.name).sort();
  expect(names).toEqual(['_id_', 'number_1']);
  expect((await readAll(tickets)).map((ticket) => ticket._id)).toEqual(['g1', 't1', 't2']);
  // The data set's documents share a stage, so the test's unique index would have refused them.
  await tickets.insertOne({ _id: 't4', number: 4, stage: 'open' });
});

test('reloadDataSession drops a collection a test made with an index of its own, and a view', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const db = database(targetA);
  await db.collection('members').createIndex({ userId: 1 }, { unique: true });
  await db.collection('members').insertOne({ _id: 'm1', userId: 'u1' });
  await db.createCollection('open_tickets', {
    viewOn: 'tickets',
    pipeline: [{ $match: { stage: 'open' } }],
  });

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  expect(
    collections
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'))
      .sort()
  ).toEqual(['tickets']);
  // Twice in a row: the index that would refuse it went with the collection.
  await db.collection('members').insertMany([
    { _id: 'm1', userId: 'u1' },
    { _id: 'm2', userId: 'u1' },
  ]);
});

test('reloadDataSession loads a data set collection again when a test gave it a validator', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const db = database(targetA);
  await db.command({
    collMod: 'tickets',
    validator: { number: { $type: 'string' } },
    validationAction: 'error',
  });

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  const [tickets] = await db.listCollections({ name: 'tickets' }).toArray();
  expect(tickets.options).toEqual({});
  // The validator would have refused a number.
  await db.collection('tickets').insertOne({ _id: 't5', number: 5 });
});

test('reloadDataSession loads a data set collection again when a test hid one of its indexes', async () => {
  opened = await openDataSession({ dataSet, logger, store });
  const tickets = database(targetA).collection('tickets');
  await database(targetA).command({
    collMod: 'tickets',
    index: { name: 'number_1', hidden: true },
  });

  await reloadDataSession({ client: store.client, dataSet, session: opened.session });

  const index = (await tickets.indexes()).find(({ name }) => name === 'number_1');
  expect(index.hidden).toBeUndefined();
});
