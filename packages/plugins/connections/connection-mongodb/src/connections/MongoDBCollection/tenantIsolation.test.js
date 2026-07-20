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

// Two-org isolation tests: every resolver is called with an org_a tenant
// verdict against collections seeded with org_a and org_b documents, and must
// never read, match, or write across the wall.

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from './MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from './MongoDBFindOne/MongoDBFindOne.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const tenant = { field: 'organizationId', value: 'org_a' };

function makeConnection(collection, extra = {}) {
  return { databaseUri, databaseName, collection, ...extra };
}

async function readAll(collection) {
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const docs = await testCollection.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs;
}

test('find only returns docs for the tenant org', async () => {
  const collection = 'tenantIsolationFind';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a' },
      { _id: 'a2', organizationId: 'org_a' },
      { _id: 'b1', organizationId: 'org_b' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBFind({
    request: { query: {}, options: { sort: [['_id', 1]] } },
    connection,
    tenant,
  });
  expect(res).toEqual([
    { _id: 'a1', organizationId: 'org_a' },
    { _id: 'a2', organizationId: 'org_a' },
  ]);
});

test('find with an authored organizationId query throws', async () => {
  const connection = makeConnection('tenantIsolationFind', { read: true });
  await expect(
    MongoDBFind({ request: { query: { organizationId: 'org_b' } }, connection, tenant })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in a query');
});

test('find with a custom tenant field name only returns that tenant', async () => {
  const collection = 'tenantIsolationFindCustomField';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 't1', tenantId: 't_1' },
      { _id: 't2', tenantId: 't_2' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBFind({
    request: { query: {} },
    connection,
    tenant: { field: 'tenantId', value: 't_1' },
  });
  expect(res).toEqual([{ _id: 't1', tenantId: 't_1' }]);
});

test('findOne can not fetch another org doc by _id', async () => {
  const collection = 'tenantIsolationFindOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', v: 'a' },
      { _id: 'b1', organizationId: 'org_b', v: 'b' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const walled = await MongoDBFindOne({ request: { query: { _id: 'b1' } }, connection, tenant });
  expect(walled).toEqual(null);
  const own = await MongoDBFindOne({ request: { query: { _id: 'a1' } }, connection, tenant });
  expect(own).toEqual({ _id: 'a1', organizationId: 'org_a', v: 'a' });
});

test('aggregation only returns tenant docs and same-collection $lookup joins are walled', async () => {
  const collection = 'tenantIsolationAggregation';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', group: 'g' },
      { _id: 'a2', organizationId: 'org_a', group: 'g' },
      { _id: 'b1', organizationId: 'org_b', group: 'g' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBAggregation({
    request: {
      pipeline: [
        {
          $lookup: {
            from: collection,
            localField: 'group',
            foreignField: 'group',
            as: 'joined',
          },
        },
        { $sort: { _id: 1 } },
        { $project: { organizationId: 1, joined: { _id: 1, organizationId: 1 } } },
      ],
    },
    connection,
    tenant,
  });
  expect(res).toEqual([
    {
      _id: 'a1',
      organizationId: 'org_a',
      joined: [
        { _id: 'a1', organizationId: 'org_a' },
        { _id: 'a2', organizationId: 'org_a' },
      ],
    },
    {
      _id: 'a2',
      organizationId: 'org_a',
      joined: [
        { _id: 'a1', organizationId: 'org_a' },
        { _id: 'a2', organizationId: 'org_a' },
      ],
    },
  ]);
});

test('aggregation with an authored organizationId $match throws', async () => {
  const connection = makeConnection('tenantIsolationAggregation', { read: true });
  await expect(
    MongoDBAggregation({
      request: { pipeline: [{ $match: { organizationId: 'org_b' } }] },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in a $match stage');
});

test('aggregation with $out throws on a tenant connection even when write is allowed', async () => {
  const connection = makeConnection('tenantIsolationAggregation', { read: true, write: true });
  await expect(
    MongoDBAggregation({
      request: { pipeline: [{ $out: 'tenantIsolationAggregationOut' }] },
      connection,
      tenant,
    })
  ).rejects.toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$out" or "$merge"'
  );
});

test('aggregation with a $geoNear first stage only returns tenant docs', async () => {
  const collection = 'tenantIsolationGeoNear';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', location: { type: 'Point', coordinates: [0, 0] } },
      { _id: 'b1', organizationId: 'org_b', location: { type: 'Point', coordinates: [0, 0] } },
    ],
  });
  const { collection: testCollection, client } = await getTestCollection({ collection });
  await testCollection.createIndex({ location: '2dsphere' });
  await client.close();
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBAggregation({
    request: {
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [0, 0] },
            distanceField: 'distance',
          },
        },
        { $project: { organizationId: 1 } },
      ],
    },
    connection,
    tenant,
  });
  expect(res).toEqual([{ _id: 'a1', organizationId: 'org_a' }]);
});

test('insertOne stamps the tenant field on the doc', async () => {
  const collection = 'tenantIsolationInsertOne';
  await populateTestMongoDb({ collection, documents: [{ _id: 'seed' }] });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBInsertOne({
    request: { doc: { _id: 'insertOne', v: 1 } },
    connection,
    tenant,
  });
  expect(res).toEqual({ acknowledged: true, insertedId: 'insertOne' });
  const docs = await readAll(collection);
  expect(docs).toEqual([{ _id: 'insertOne', organizationId: 'org_a', v: 1 }, { _id: 'seed' }]);
});

test('insertOne with an authored organizationId throws', async () => {
  const connection = makeConnection('tenantIsolationInsertOne', { write: true });
  await expect(
    MongoDBInsertOne({
      request: { doc: { _id: 'authored', organizationId: 'org_b' } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in an insert document');
});

test('insertMany stamps the tenant field on every doc', async () => {
  const collection = 'tenantIsolationInsertMany';
  await populateTestMongoDb({ collection, documents: [{ _id: 'seed' }] });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBInsertMany({
    request: {
      docs: [
        { _id: 'many1', v: 1 },
        { _id: 'many2', v: 2 },
      ],
    },
    connection,
    tenant,
  });
  expect(res).toEqual({
    acknowledged: true,
    insertedCount: 2,
    insertedIds: { 0: 'many1', 1: 'many2' },
  });
  const docs = await readAll(collection);
  expect(docs).toEqual([
    { _id: 'many1', organizationId: 'org_a', v: 1 },
    { _id: 'many2', organizationId: 'org_a', v: 2 },
    { _id: 'seed' },
  ]);
});

test('insertConsecutiveId stamps the tenant field on the doc', async () => {
  const collection = 'tenantIsolationInsertConsecutiveId';
  await populateTestMongoDb({ collection, documents: [{ _id: 'seed' }] });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBInsertConsecutiveId({
    request: { doc: { v: 1 }, prefix: 'T', length: 6 },
    connection,
    tenant,
  });
  expect(res).toEqual({ acknowledged: true, insertedId: 'T000001' });
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const doc = await testCollection.findOne({ _id: 'T000001' });
  await client.close();
  expect(doc).toEqual({ _id: 'T000001', organizationId: 'org_a', v: 1 });
});

test('updateOne can not touch another org doc', async () => {
  const collection = 'tenantIsolationUpdateOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', v: 'before' },
      { _id: 'b1', organizationId: 'org_b', v: 'before' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const walled = await MongoDBUpdateOne({
    request: {
      filter: { _id: 'b1' },
      update: { $set: { v: 'after' } },
      disableNoMatchError: true,
    },
    connection,
    tenant,
  });
  expect(walled).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
  });
  const own = await MongoDBUpdateOne({
    request: { filter: { _id: 'a1' }, update: { $set: { v: 'after' } } },
    connection,
    tenant,
  });
  expect(own).toEqual({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
  });
  const docs = await readAll(collection);
  expect(docs).toEqual([
    { _id: 'a1', organizationId: 'org_a', v: 'after' },
    { _id: 'b1', organizationId: 'org_b', v: 'before' },
  ]);
});

test('updateOne with an authored organizationId in the update throws', async () => {
  const connection = makeConnection('tenantIsolationUpdateOne', { write: true });
  await expect(
    MongoDBUpdateOne({
      request: { filter: { _id: 'a1' }, update: { $set: { organizationId: 'org_b' } } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in an update');
});

test('updateOne upsert inserts a doc carrying the tenant field', async () => {
  const collection = 'tenantIsolationUpsert';
  await populateTestMongoDb({ collection, documents: [{ _id: 'seed' }] });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBUpdateOne({
    request: {
      filter: { _id: 'upserted' },
      update: { $set: { v: 'after' } },
      options: { upsert: true },
    },
    connection,
    tenant,
  });
  expect(res).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: 'upserted',
    upsertedCount: 1,
  });
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const doc = await testCollection.findOne({ _id: 'upserted' });
  await client.close();
  expect(doc).toEqual({ _id: 'upserted', organizationId: 'org_a', v: 'after' });
});

test('updateMany only updates tenant org docs', async () => {
  const collection = 'tenantIsolationUpdateMany';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', v: 'before' },
      { _id: 'a2', organizationId: 'org_a', v: 'before' },
      { _id: 'b1', organizationId: 'org_b', v: 'before' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBUpdateMany({
    request: { filter: { v: 'before' }, update: { $set: { v: 'after' } } },
    connection,
    tenant,
  });
  expect(res).toEqual({
    matchedCount: 2,
    modifiedCount: 2,
    upsertedId: null,
    upsertedCount: 0,
  });
  const docs = await readAll(collection);
  expect(docs).toEqual([
    { _id: 'a1', organizationId: 'org_a', v: 'after' },
    { _id: 'a2', organizationId: 'org_a', v: 'after' },
    { _id: 'b1', organizationId: 'org_b', v: 'before' },
  ]);
});

test('deleteOne can not delete another org doc', async () => {
  const collection = 'tenantIsolationDeleteOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a' },
      { _id: 'b1', organizationId: 'org_b' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const walled = await MongoDBDeleteOne({
    request: { filter: { _id: 'b1' } },
    connection,
    tenant,
  });
  expect(walled).toEqual({ acknowledged: true, deletedCount: 0 });
  const own = await MongoDBDeleteOne({
    request: { filter: { _id: 'a1' } },
    connection,
    tenant,
  });
  expect(own).toEqual({ acknowledged: true, deletedCount: 1 });
  const docs = await readAll(collection);
  expect(docs).toEqual([{ _id: 'b1', organizationId: 'org_b' }]);
});

test('deleteMany only deletes tenant org docs', async () => {
  const collection = 'tenantIsolationDeleteMany';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a' },
      { _id: 'a2', organizationId: 'org_a' },
      { _id: 'b1', organizationId: 'org_b' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBDeleteMany({ request: { filter: {} }, connection, tenant });
  expect(res).toEqual({ acknowledged: true, deletedCount: 2 });
  const docs = await readAll(collection);
  expect(docs).toEqual([{ _id: 'b1', organizationId: 'org_b' }]);
});

test('deleteMany with an authored organizationId filter throws', async () => {
  const connection = makeConnection('tenantIsolationDeleteMany', { write: true });
  await expect(
    MongoDBDeleteMany({
      request: { filter: { organizationId: 'org_b' } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in a filter');
});

test('versionedUpdateOne stamps the version copy and stays walled', async () => {
  const collection = 'tenantIsolationVersionedUpdateOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', doc_id: 'va', organizationId: 'org_a', v: 'before' },
      { _id: 'b1', doc_id: 'vb', organizationId: 'org_b', v: 'before' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const own = await MongoDBVersionedUpdateOne({
    request: { filter: { doc_id: 'va' }, update: { $set: { v: 'after' } } },
    connection,
    tenant,
  });
  expect(own).toEqual({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
    upsertedId: null,
    upsertedCount: 0,
  });
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const versions = await testCollection
    .find({ doc_id: 'va' }, { projection: { _id: 0 }, sort: { v: 1 } })
    .toArray();
  const orgBDocs = await testCollection.find({ doc_id: 'vb' }).toArray();
  await client.close();
  expect(versions).toEqual([
    { doc_id: 'va', organizationId: 'org_a', v: 'after' },
    { doc_id: 'va', organizationId: 'org_a', v: 'before' },
  ]);

  const walled = await MongoDBVersionedUpdateOne({
    request: {
      filter: { doc_id: 'vb' },
      update: { $set: { v: 'after' } },
      disableNoMatchError: true,
    },
    connection,
    tenant,
  });
  expect(walled).toEqual({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedId: null,
    upsertedCount: 0,
  });
  // No version copy of the org_b doc was created and it is unchanged.
  expect(orgBDocs).toEqual([{ _id: 'b1', doc_id: 'vb', organizationId: 'org_b', v: 'before' }]);
});

test('bulkWrite operations are walled per operation kind', async () => {
  const collection = 'tenantIsolationBulkWrite';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organizationId: 'org_a', v: 'before' },
      { _id: 'b1', organizationId: 'org_b', v: 'before' },
      { _id: 'b2', organizationId: 'org_b', v: 'before' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBBulkWrite({
    request: {
      operations: [
        { insertOne: { document: { _id: 'bw_new', v: 1 } } },
        { updateOne: { filter: { _id: 'a1' }, update: { $set: { v: 'after' } } } },
        { updateOne: { filter: { _id: 'b1' }, update: { $set: { v: 'after' } } } },
        { deleteOne: { filter: { _id: 'b2' } } },
      ],
    },
    connection,
    tenant,
  });
  expect(res).toEqual({
    insertedCount: 1,
    insertedIds: { 0: 'bw_new' },
    matchedCount: 1,
    modifiedCount: 1,
    deletedCount: 0,
    upsertedCount: 0,
    upsertedIds: {},
  });
  const docs = await readAll(collection);
  expect(docs).toEqual([
    { _id: 'a1', organizationId: 'org_a', v: 'after' },
    { _id: 'b1', organizationId: 'org_b', v: 'before' },
    { _id: 'b2', organizationId: 'org_b', v: 'before' },
    { _id: 'bw_new', organizationId: 'org_a', v: 1 },
  ]);
});

test('bulkWrite with an authored organizationId throws before writing', async () => {
  const connection = makeConnection('tenantIsolationBulkWrite', { write: true });
  await expect(
    MongoDBBulkWrite({
      request: {
        operations: [{ insertOne: { document: { _id: 'bad', organizationId: 'org_b' } } }],
      },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organizationId" can not be set in an insert document');
});
