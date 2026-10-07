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

import { ObjectId } from 'mongodb';

import getWalledCollection from './getWalledCollection.js';
import getTestCollection from '../../test/getTestCollection.js';
import populateTestMongoDb from '../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const orgA = { field: 'organization_id', value: 'org_a' };

function connectionFor(collection, extra = {}) {
  return { databaseUri, databaseName: 'test', collection, read: true, write: true, ...extra };
}

function clientFor(collection, { tenant = orgA, tenantGuard, extra } = {}) {
  return getWalledCollection({
    connection: connectionFor(collection, extra),
    connectionId: 'walled',
    requestId: 'req',
    tenant,
    tenantGuard,
  });
}

async function readAll(collection) {
  const { collection: raw, client } = await getTestCollection({ collection });
  const docs = await raw.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs;
}

async function emptyCollection(collection) {
  const { collection: raw, client } = await getTestCollection({ collection });
  await raw.deleteMany({});
  await client.close();
}

const seed = [
  { _id: 'a1', organization_id: 'org_a', group: 'g', n: 1 },
  { _id: 'a2', organization_id: 'org_a', group: 'g', n: 2 },
  { _id: 'b1', organization_id: 'org_b', group: 'g', n: 3 },
];

test('find and findOne only see the caller org, as arrays and natives', async () => {
  const c = 'walledRead';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c);
  const rows = await walled.find({}, { sort: { _id: 1 } });
  expect(Array.isArray(rows)).toBe(true);
  expect(rows.map((r) => r._id)).toEqual(['a1', 'a2']);
  expect(await walled.findOne({ _id: 'b1' })).toBe(null);
  expect((await walled.findOne({ _id: 'a1' })).n).toBe(1);
  await expect(walled.find({ organization_id: 'org_b' })).rejects.toThrow('Tenant field');
});

test('ObjectIds survive the round trip', async () => {
  const c = 'walledObjectId';
  const _id = new ObjectId();
  await populateTestMongoDb({ collection: c, documents: [{ _id, organization_id: 'org_a' }] });
  const found = await clientFor(c).findOne({ _id });
  expect(found._id).toBeInstanceOf(ObjectId);
  expect(found._id.equals(_id)).toBe(true);
});

test('countDocuments counts only the caller org', async () => {
  const c = 'walledCount';
  await populateTestMongoDb({ collection: c, documents: seed });
  expect(await clientFor(c).countDocuments({})).toBe(2);
  expect(
    await clientFor(c, { tenant: { field: 'organization_id', value: 'org_b' } }).countDocuments({})
  ).toBe(1);
});

test('aggregate is scoped, $lookup is scoped, $out and $merge are refused', async () => {
  const c = 'walledAggregate';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c);
  const rows = await walled.aggregate([
    { $lookup: { from: c, localField: 'group', foreignField: 'group', as: 'joined' } },
    { $sort: { _id: 1 } },
    { $project: { joined: { _id: 1 } } },
  ]);
  expect(rows).toHaveLength(2);
  rows.forEach((row) => expect(row.joined.map((j) => j._id).sort()).toEqual(['a1', 'a2']));
  await expect(walled.aggregate([{ $out: 'elsewhere' }])).rejects.toThrow('$out');
  await expect(walled.aggregate([{ $merge: { into: 'elsewhere' } }])).rejects.toThrow('$merge');
  expect(await readAll('elsewhere')).toEqual([]);
});

test('insertOne, insertMany are stamped and reject authored tenant values', async () => {
  const c = 'walledInsert';
  await emptyCollection(c);
  const walled = clientFor(c);
  await walled.insertOne({ _id: 'x1' });
  const many = await walled.insertMany([{ _id: 'x2' }, { _id: 'x3' }]);
  expect(many.insertedCount).toBe(2);
  expect((await readAll(c)).map((d) => d.organization_id)).toEqual(['org_a', 'org_a', 'org_a']);
  await expect(walled.insertOne({ _id: 'x4', organization_id: 'org_b' })).rejects.toThrow();
});

test('updateOne, updateMany, findOneAndUpdate can not touch another org', async () => {
  const c = 'walledUpdate';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c);
  expect((await walled.updateOne({ _id: 'b1' }, { $set: { n: 99 } })).matchedCount).toBe(0);
  expect((await walled.updateMany({}, { $set: { touched: true } })).modifiedCount).toBe(2);
  expect(await walled.findOneAndUpdate({ _id: 'b1' }, { $set: { n: 99 } })).toBe(null);
  const doc = await walled.findOneAndUpdate(
    { _id: 'a1' },
    { $set: { n: 10 } },
    { returnDocument: 'after' }
  );
  expect(doc.n).toBe(10);
  const rows = await readAll(c);
  expect(rows.find((r) => r._id === 'b1')).toEqual(seed[2]);
  expect(rows.find((r) => r._id === 'a2').touched).toBe(true);
  await expect(
    walled.updateOne({ _id: 'a1' }, { $set: { organization_id: 'org_b' } })
  ).rejects.toThrow();
});

test('upserts are stamped with the caller org', async () => {
  const c = 'walledUpsert';
  await emptyCollection(c);
  const walled = clientFor(c);
  await walled.updateOne({ _id: 'u1' }, { $set: { n: 1 } }, { upsert: true });
  await walled.findOneAndUpdate({ _id: 'u2' }, { $set: { n: 1 } }, { upsert: true });
  expect((await readAll(c)).map((d) => d.organization_id)).toEqual(['org_a', 'org_a']);
});

test('deleteOne and deleteMany can not delete another org rows', async () => {
  const c = 'walledDelete';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c);
  expect((await walled.deleteOne({ _id: 'b1' })).deletedCount).toBe(0);
  expect((await walled.deleteMany({})).deletedCount).toBe(2);
  expect((await readAll(c)).map((d) => d._id)).toEqual(['b1']);
});

test('bulkWrite is scoped and stamped', async () => {
  const c = 'walledBulk';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c);
  await walled.bulkWrite([
    { insertOne: { document: { _id: 'n1' } } },
    { updateOne: { filter: { _id: 'b1' }, update: { $set: { n: 99 } } } },
    { deleteOne: { filter: { _id: 'b1' } } },
  ]);
  const rows = await readAll(c);
  expect(rows.find((r) => r._id === 'n1').organization_id).toBe('org_a');
  expect(rows.find((r) => r._id === 'b1')).toEqual(seed[2]);
});

test('the change log records are stamped with the caller org', async () => {
  const c = 'walledLog';
  await populateTestMongoDb({ collection: c, documents: seed });
  await emptyCollection(`${c}Log`);
  const walled = clientFor(c, { extra: { changeLog: { collection: `${c}Log` } } });
  await walled.insertOne({ _id: 'l1' });
  await walled.findOneAndUpdate({ _id: 'a1' }, { $set: { n: 5 } });
  const log = await readAll(`${c}Log`);
  expect(log.map((r) => r.type).sort()).toEqual(['MongoDBFindOneAndUpdate', 'MongoDBInsertOne']);
  log.forEach((r) => expect(r.organization_id).toBe('org_a'));
});

test('the write guard of a shared connection refuses a write that would leave a row without an organization', async () => {
  const c = 'walledGuard';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c, {
    tenant: null,
    tenantGuard: { field: 'organization_id', readOnly: false },
  });
  await expect(walled.insertOne({ _id: 'g1' })).rejects.toThrow();
  await walled.insertOne({ _id: 'g2', organization_id: 'org_b' });
  await expect(
    walled.updateOne({ _id: 'a1' }, { $unset: { organization_id: '' } })
  ).rejects.toThrow();
});

test('under tenant: none the walled client reads every organization and refuses every write', async () => {
  const c = 'walledReadOnly';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c, {
    tenant: null,
    tenantGuard: { field: 'organization_id', readOnly: true },
  });
  expect((await walled.find({})).map((doc) => doc._id)).toEqual(['a1', 'a2', 'b1']);
  expect(await walled.countDocuments({})).toBe(3);
  const writes = [
    ['insertOne', () => walled.insertOne({ _id: 'n1', organization_id: 'org_a' })],
    ['insertMany', () => walled.insertMany([{ _id: 'n1', organization_id: 'org_a' }])],
    ['updateOne', () => walled.updateOne({ _id: 'a1' }, { $set: { n: 9 } })],
    ['updateMany', () => walled.updateMany({}, { $set: { n: 9 } })],
    ['findOneAndUpdate', () => walled.findOneAndUpdate({ _id: 'a1' }, { $set: { n: 9 } })],
    ['deleteOne', () => walled.deleteOne({ _id: 'a1' })],
    ['deleteMany', () => walled.deleteMany({})],
    ['bulkWrite', () => walled.bulkWrite([{ deleteOne: { filter: { _id: 'a1' } } }])],
  ];
  for (const [method, write] of writes) {
    await expect(write()).rejects.toThrow(
      `The walled MongoDB client's "${method}" writes, and a request with tenant: none may only read.`
    );
  }
  expect(await readAll(c)).toEqual(seed);
});

test('a broken stamp is caught by verifyStoredTenant and the row removed', async () => {
  // A verdict whose value is not an organisation id stores a row the wall
  // would hide from everyone; the read-back catches it and deletes the row.
  const c = 'walledVerify';
  await emptyCollection(c);
  const walled = clientFor(c, { tenant: { field: 'organization_id', value: 123 } });
  await expect(walled.insertOne({ _id: 'v1' })).rejects.toThrow(
    /is not the requesting organisation/
  );
  expect(await readAll(c)).toEqual([]);
});

test('no tenant and no guard behaves as the plain requests', async () => {
  const c = 'walledPlain';
  await populateTestMongoDb({ collection: c, documents: seed });
  const walled = clientFor(c, { tenant: null });
  expect(await walled.find({})).toHaveLength(3);
  await walled.insertOne({ _id: 'p1' });
  expect((await readAll(c)).find((r) => r._id === 'p1')).toEqual({ _id: 'p1' });
});

test('a connection without write refuses writes', async () => {
  const c = 'walledNoWrite';
  const walled = clientFor(c, { extra: { write: false } });
  await expect(walled.insertOne({ _id: 'w' })).rejects.toThrow('does not allow writes');
});
