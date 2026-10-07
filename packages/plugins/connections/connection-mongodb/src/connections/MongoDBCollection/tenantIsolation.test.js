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
import MongoDBEnrichmentClaim from './MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from './MongoDBEnrichmentComplete/MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from './MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from './MongoDBFindOne/MongoDBFindOne.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBTableQuery from './MongoDBTableQuery/MongoDBTableQuery.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import findLogCollectionRecordTestMongoDb from '../../../test/findLogCollectionRecordTestMongoDb.js';
import { columnDefs, fields } from '../../../test/enrichmentTable.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const tenant = { field: 'organization_id', value: 'org_a' };

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
      { _id: 'a1', organization_id: 'org_a' },
      { _id: 'a2', organization_id: 'org_a' },
      { _id: 'b1', organization_id: 'org_b' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBFind({
    request: { query: {}, options: { sort: [['_id', 1]] } },
    connection,
    tenant,
  });
  expect(res).toEqual([
    { _id: 'a1', organization_id: 'org_a' },
    { _id: 'a2', organization_id: 'org_a' },
  ]);
});

test('find with an authored organization_id query throws', async () => {
  const connection = makeConnection('tenantIsolationFind', { read: true });
  await expect(
    MongoDBFind({ request: { query: { organization_id: 'org_b' } }, connection, tenant })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in a query');
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
      { _id: 'a1', organization_id: 'org_a', v: 'a' },
      { _id: 'b1', organization_id: 'org_b', v: 'b' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const walled = await MongoDBFindOne({ request: { query: { _id: 'b1' } }, connection, tenant });
  expect(walled).toEqual(null);
  const own = await MongoDBFindOne({ request: { query: { _id: 'a1' } }, connection, tenant });
  expect(own).toEqual({ _id: 'a1', organization_id: 'org_a', v: 'a' });
});

test('aggregation only returns tenant docs and same-collection $lookup joins are walled', async () => {
  const collection = 'tenantIsolationAggregation';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a', group: 'g' },
      { _id: 'a2', organization_id: 'org_a', group: 'g' },
      { _id: 'b1', organization_id: 'org_b', group: 'g' },
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
        { $project: { organization_id: 1, joined: { _id: 1, organization_id: 1 } } },
      ],
    },
    connection,
    tenant,
  });
  expect(res).toEqual([
    {
      _id: 'a1',
      organization_id: 'org_a',
      joined: [
        { _id: 'a1', organization_id: 'org_a' },
        { _id: 'a2', organization_id: 'org_a' },
      ],
    },
    {
      _id: 'a2',
      organization_id: 'org_a',
      joined: [
        { _id: 'a1', organization_id: 'org_a' },
        { _id: 'a2', organization_id: 'org_a' },
      ],
    },
  ]);
});

test('aggregation with an authored organization_id $match throws', async () => {
  const connection = makeConnection('tenantIsolationAggregation', { read: true });
  await expect(
    MongoDBAggregation({
      request: { pipeline: [{ $match: { organization_id: 'org_b' } }] },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in a $match stage');
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

test('aggregation with a $geoNear first stage is refused without tenant: authored', async () => {
  const connection = makeConnection('tenantIsolationGeoNear', { read: true });
  await expect(
    MongoDBAggregation({
      request: {
        pipeline: [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [0, 0] },
              distanceField: 'distance',
            },
          },
        ],
      },
      connection,
      tenant,
    })
  ).rejects.toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$geoNear" unless the request declares "tenant: authored"'
  );
});

test('authored $geoNear with the org equality in query only returns tenant docs', async () => {
  const collection = 'tenantIsolationGeoNear';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a', location: { type: 'Point', coordinates: [0, 0] } },
      { _id: 'b1', organization_id: 'org_b', location: { type: 'Point', coordinates: [0, 0] } },
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
            // The authored tenant clause (tenant: authored) - audited against
            // the verdict, then enforced by MongoDB itself.
            query: { organization_id: 'org_a' },
          },
        },
        { $project: { organization_id: 1 } },
      ],
    },
    connection,
    tenant: { ...tenant, authored: true },
  });
  expect(res).toEqual([{ _id: 'a1', organization_id: 'org_a' }]);
});

test('authored $geoNear audit refuses a missing org equality', async () => {
  const connection = makeConnection('tenantIsolationGeoNear', { read: true });
  await expect(
    MongoDBAggregation({
      request: {
        pipeline: [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [0, 0] },
              distanceField: 'distance',
            },
          },
        ],
      },
      connection,
      tenant: { ...tenant, authored: true },
    })
  ).rejects.toThrow(
    'Request declares "tenant: authored", but its "$geoNear" stage has no "query" equality on tenant field "organization_id"'
  );
});

test('$graphLookup is refused without tenant: authored', async () => {
  const connection = makeConnection('tenantIsolationGraphLookup', { read: true });
  await expect(
    MongoDBAggregation({
      request: {
        pipeline: [
          {
            $graphLookup: {
              from: 'tenantIsolationGraphLookup',
              startWith: '$_id',
              connectFromField: '_id',
              connectToField: 'parentId',
              as: 'descendants',
            },
          },
        ],
      },
      connection,
      tenant,
    })
  ).rejects.toThrow(
    'Aggregation pipelines on a tenant connection can not contain "$graphLookup" unless the request declares "tenant: authored"'
  );
});

test('authored $graphLookup with the org equality in restrictSearchWithMatch walls the traversal', async () => {
  const collection = 'tenantIsolationGraphLookup';
  await populateTestMongoDb({
    collection,
    documents: [
      // org_a: root -> childA. org_b holds a doc that ALSO claims root as its
      // parent - without the restrict clause the traversal would leak it.
      { _id: 'root', organization_id: 'org_a', parentId: null },
      { _id: 'childA', organization_id: 'org_a', parentId: 'root' },
      { _id: 'childB', organization_id: 'org_b', parentId: 'root' },
    ],
  });
  const connection = makeConnection(collection, { read: true });
  const res = await MongoDBAggregation({
    request: {
      pipeline: [
        { $match: { _id: 'root' } },
        {
          $graphLookup: {
            from: collection,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parentId',
            as: 'descendants',
            // The authored tenant clause (tenant: authored) - audited against
            // the verdict, then enforced by MongoDB on every traversal step.
            restrictSearchWithMatch: { organization_id: 'org_a' },
          },
        },
        { $project: { 'descendants._id': 1 } },
      ],
    },
    connection,
    tenant: { ...tenant, authored: true },
  });
  expect(res).toEqual([{ _id: 'root', descendants: [{ _id: 'childA' }] }]);
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
  expect(docs).toEqual([{ _id: 'insertOne', organization_id: 'org_a', v: 1 }, { _id: 'seed' }]);
});

test('insertOne with an authored organization_id throws', async () => {
  const connection = makeConnection('tenantIsolationInsertOne', { write: true });
  await expect(
    MongoDBInsertOne({
      request: { doc: { _id: 'authored', organization_id: 'org_b' } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in an insert document');
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
    { _id: 'many1', organization_id: 'org_a', v: 1 },
    { _id: 'many2', organization_id: 'org_a', v: 2 },
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
  expect(doc).toEqual({ _id: 'T000001', organization_id: 'org_a', v: 1 });
});

test('updateOne can not touch another org doc', async () => {
  const collection = 'tenantIsolationUpdateOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a', v: 'before' },
      { _id: 'b1', organization_id: 'org_b', v: 'before' },
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
    { _id: 'a1', organization_id: 'org_a', v: 'after' },
    { _id: 'b1', organization_id: 'org_b', v: 'before' },
  ]);
});

test('updateOne with an authored organization_id in the update throws', async () => {
  const connection = makeConnection('tenantIsolationUpdateOne', { write: true });
  await expect(
    MongoDBUpdateOne({
      request: { filter: { _id: 'a1' }, update: { $set: { organization_id: 'org_b' } } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in an update');
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
  expect(doc).toEqual({ _id: 'upserted', organization_id: 'org_a', v: 'after' });
});

test('updateMany only updates tenant org docs', async () => {
  const collection = 'tenantIsolationUpdateMany';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a', v: 'before' },
      { _id: 'a2', organization_id: 'org_a', v: 'before' },
      { _id: 'b1', organization_id: 'org_b', v: 'before' },
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
    { _id: 'a1', organization_id: 'org_a', v: 'after' },
    { _id: 'a2', organization_id: 'org_a', v: 'after' },
    { _id: 'b1', organization_id: 'org_b', v: 'before' },
  ]);
});

test('deleteOne can not delete another org doc', async () => {
  const collection = 'tenantIsolationDeleteOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a' },
      { _id: 'b1', organization_id: 'org_b' },
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
  expect(docs).toEqual([{ _id: 'b1', organization_id: 'org_b' }]);
});

test('deleteMany only deletes tenant org docs', async () => {
  const collection = 'tenantIsolationDeleteMany';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a' },
      { _id: 'a2', organization_id: 'org_a' },
      { _id: 'b1', organization_id: 'org_b' },
    ],
  });
  const connection = makeConnection(collection, { write: true });
  const res = await MongoDBDeleteMany({ request: { filter: {} }, connection, tenant });
  expect(res).toEqual({ acknowledged: true, deletedCount: 2 });
  const docs = await readAll(collection);
  expect(docs).toEqual([{ _id: 'b1', organization_id: 'org_b' }]);
});

test('deleteMany with an authored organization_id filter throws', async () => {
  const connection = makeConnection('tenantIsolationDeleteMany', { write: true });
  await expect(
    MongoDBDeleteMany({
      request: { filter: { organization_id: 'org_b' } },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in a filter');
});

test('versionedUpdateOne stamps the version copy and stays walled', async () => {
  const collection = 'tenantIsolationVersionedUpdateOne';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', doc_id: 'va', organization_id: 'org_a', v: 'before' },
      { _id: 'b1', doc_id: 'vb', organization_id: 'org_b', v: 'before' },
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
    { doc_id: 'va', organization_id: 'org_a', v: 'after' },
    { doc_id: 'va', organization_id: 'org_a', v: 'before' },
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
  expect(orgBDocs).toEqual([{ _id: 'b1', doc_id: 'vb', organization_id: 'org_b', v: 'before' }]);
});

test('bulkWrite operations are walled per operation kind', async () => {
  const collection = 'tenantIsolationBulkWrite';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a', v: 'before' },
      { _id: 'b1', organization_id: 'org_b', v: 'before' },
      { _id: 'b2', organization_id: 'org_b', v: 'before' },
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
    { _id: 'a1', organization_id: 'org_a', v: 'after' },
    { _id: 'b1', organization_id: 'org_b', v: 'before' },
    { _id: 'b2', organization_id: 'org_b', v: 'before' },
    { _id: 'bw_new', organization_id: 'org_a', v: 1 },
  ]);
});

test('bulkWrite with an authored organization_id throws before writing', async () => {
  const connection = makeConnection('tenantIsolationBulkWrite', { write: true });
  await expect(
    MongoDBBulkWrite({
      request: {
        operations: [{ insertOne: { document: { _id: 'bad', organization_id: 'org_b' } } }],
      },
      connection,
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in an insert document');
});

test('insertOne changeLog record is stamped with the tenant verdict', async () => {
  const collection = 'tenantIsolationInsertOneLog';
  const logCollection = 'tenantIsolationInsertOneLog_log';
  const connection = makeConnection(collection, {
    write: true,
    changeLog: { collection: logCollection },
  });
  await MongoDBInsertOne({
    request: { doc: { _id: 'log_a1' } },
    connection,
    requestId: 'tenantLogInsertOne',
    tenant,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'tenantLogInsertOne',
  });
  expect(logged.organization_id).toEqual('org_a');
});

test('updateOne changeLog record is stamped with the tenant verdict', async () => {
  const collection = 'tenantIsolationUpdateOneLog';
  const logCollection = 'tenantIsolationUpdateOneLog_log';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'u1', organization_id: 'org_a', v: 'before' }],
  });
  const connection = makeConnection(collection, {
    write: true,
    changeLog: { collection: logCollection },
  });
  await MongoDBUpdateOne({
    request: { filter: { _id: 'u1' }, update: { $set: { v: 'after' } } },
    connection,
    requestId: 'tenantLogUpdateOne',
    tenant,
  });
  const logged = await findLogCollectionRecordTestMongoDb({
    logCollection,
    requestId: 'tenantLogUpdateOne',
  });
  expect(logged.organization_id).toEqual('org_a');
});

const lookupPipeline = (collection) => [
  {
    $lookup: {
      from: collection,
      localField: 'group',
      foreignField: 'group',
      as: 'joined',
    },
  },
  { $project: { organization_id: 1, group: 1, 'joined._id': 1, 'joined.organization_id': 1 } },
];

const lookupDocs = [
  { _id: 'a1', organization_id: 'org_a', group: 'g' },
  { _id: 'a2', organization_id: 'org_a', group: 'g' },
  { _id: 'b1', organization_id: 'org_b', group: 'g' },
];

test("table query: a $lookup in the base pipeline only joins this org's rows", async () => {
  const collection = 'tenantIsolationTableQueryLookup';
  await populateTestMongoDb({ collection, documents: lookupDocs });
  const res = await MongoDBTableQuery({
    request: {
      fields: { group: { type: 'text' } },
      pipeline: lookupPipeline(collection),
      project: false,
    },
    connection: makeConnection(collection, { read: true }),
    tenant,
  });
  expect(res.total).toBe(2);
  expect(res.rows.map((row) => row._id).sort()).toEqual(['a1', 'a2']);
  res.rows.forEach((row) => {
    expect(row.joined.map((joined) => joined.organization_id)).toEqual(['org_a', 'org_a']);
  });
});

test('table query under tenant: none is unscoped by design and joins every org', async () => {
  const collection = 'tenantIsolationTableQueryGuard';
  await populateTestMongoDb({ collection, documents: lookupDocs });
  const res = await MongoDBTableQuery({
    request: {
      fields: { group: { type: 'text' } },
      pipeline: lookupPipeline(collection),
      project: false,
    },
    connection: makeConnection(collection, { read: true }),
    tenantGuard: { field: 'organization_id', readOnly: true },
  });
  expect(res.total).toBe(3);
  res.rows.forEach((row) => expect(row.joined).toHaveLength(3));
});

const orgB = { field: 'organization_id', value: 'org_b' };

// Two orgs share one leads table, plus a row a data fault left without an organization.
const enrichmentDocs = [
  { _id: 'a1', organization_id: 'org_a', name: 'Acme', domain: 'acme.test' },
  { _id: 'a2', organization_id: 'org_a', name: 'Arch', domain: 'arch.test' },
  { _id: 'b1', organization_id: 'org_b', name: 'Bolt', domain: 'bolt.test' },
  { _id: 'b2', organization_id: 'org_b', name: 'Bore', domain: 'bore.test' },
  { _id: 'n1', name: 'Nobody', domain: 'nobody.test' },
];

function enrichmentCell(docs, _id, columnKey) {
  return docs.find((doc) => doc._id === _id)._enrich?.[columnKey];
}

function enrichmentConnection(collection) {
  return makeConnection(collection, { read: true, write: true });
}

function enqueueEmail({ collection, ...context }) {
  return MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'] },
    connection: enrichmentConnection(collection),
    ...context,
  });
}

function claimEmail({ collection, ...context }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, columns: ['email'], limit: 10 },
    connection: enrichmentConnection(collection),
    ...context,
  });
}

function completeClaims({ collection, claims, ...context }) {
  return MongoDBEnrichmentComplete({
    request: {
      columnDefs,
      results: claims.map(({ rowKey, columnKey, claimToken }) => ({
        rowKey,
        columnKey,
        claimToken,
        status: 'ok',
        value: `${rowKey}@found.test`,
      })),
    },
    connection: enrichmentConnection(collection),
    ...context,
  });
}

test('enrichment: enqueue on a tenant connection only queues cells of its org', async () => {
  const collection = 'tenantIsolationEnrichmentEnqueue';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  const res = await enqueueEmail({ collection, tenant });
  expect(res).toMatchObject({ queued: 2, missingInputs: 0 });
  const docs = await readAll(collection);
  expect(enrichmentCell(docs, 'a1', 'email').status).toBe('queued');
  expect(enrichmentCell(docs, 'a2', 'email').status).toBe('queued');
  ['b1', 'b2', 'n1'].forEach((_id) => {
    expect(docs.find((doc) => doc._id === _id)._enrich).toBeUndefined();
  });
});

test("enrichment: claim on a tenant connection never claims another org's older queued cells", async () => {
  const collection = 'tenantIsolationEnrichmentClaim';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  await enqueueEmail({ collection, tenant: orgB });
  await enqueueEmail({ collection, tenant });
  const claims = await claimEmail({ collection, tenant });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2']);
  const docs = await readAll(collection);
  expect(enrichmentCell(docs, 'b1', 'email').status).toBe('queued');
  expect(enrichmentCell(docs, 'b2', 'email').status).toBe('queued');
  expect(docs.find((doc) => doc._id === 'n1')._enrich).toBeUndefined();
});

test("enrichment: complete on a tenant connection ignores another org's claims", async () => {
  const collection = 'tenantIsolationEnrichmentComplete';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  await enqueueEmail({ collection, tenant });
  const claims = await claimEmail({ collection, tenant });
  const leaked = await completeClaims({ collection, claims, tenant: orgB });
  expect(leaked).toMatchObject({ applied: 0, ignored: 2 });
  let docs = await readAll(collection);
  expect(enrichmentCell(docs, 'a1', 'email').status).toBe('running');
  expect(enrichmentCell(docs, 'a1', 'email').value).toBeUndefined();

  const applied = await completeClaims({ collection, claims, tenant });
  expect(applied).toMatchObject({ applied: 2, ignored: 0 });
  docs = await readAll(collection);
  expect(enrichmentCell(docs, 'a1', 'email')).toMatchObject({
    status: 'ok',
    value: 'a1@found.test',
  });
  // The autoRun pitch column downstream of email is queued on this org's rows only.
  expect(enrichmentCell(docs, 'a1', 'pitch').status).toBe('queued');
  expect(enrichmentCell(docs, 'a2', 'pitch').status).toBe('queued');
  ['b1', 'b2', 'n1'].forEach((_id) => {
    expect(docs.find((doc) => doc._id === _id)._enrich).toBeUndefined();
  });
});

test('enrichment: two orgs working one table at once each finish only their own cells', async () => {
  const collection = 'tenantIsolationEnrichmentTwoOrgs';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  await Promise.all([
    enqueueEmail({ collection, tenant }),
    enqueueEmail({ collection, tenant: orgB }),
  ]);
  const [claimsA, claimsB] = await Promise.all([
    claimEmail({ collection, tenant }),
    claimEmail({ collection, tenant: orgB }),
  ]);
  expect(claimsA.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2']);
  expect(claimsB.map((claim) => claim.rowKey).sort()).toEqual(['b1', 'b2']);
  claimsA.forEach((claim) => expect(claim.row.organization_id).toBeUndefined());
  await Promise.all([
    completeClaims({ collection, claims: claimsA, tenant }),
    completeClaims({ collection, claims: claimsB, tenant: orgB }),
  ]);
  const docs = await readAll(collection);
  ['a1', 'a2', 'b1', 'b2'].forEach((_id) => {
    expect(enrichmentCell(docs, _id, 'email')).toMatchObject({
      status: 'ok',
      value: `${_id}@found.test`,
    });
  });
  expect(docs.find((doc) => doc._id === 'n1')._enrich).toBeUndefined();
  docs.forEach((doc) => {
    expect(doc.organization_id).toEqual(
      enrichmentDocs.find((row) => row._id === doc._id).organization_id
    );
  });
});

test.each([
  ['enqueue', MongoDBEnrichmentEnqueue],
  ['claim', MongoDBEnrichmentClaim],
  ['complete', MongoDBEnrichmentComplete],
])('enrichment %s with an authored organization_id filter throws', async (_, requestType) => {
  const collection = 'tenantIsolationEnrichmentAuthored';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  await expect(
    requestType({
      request: {
        fields,
        columnDefs,
        columns: ['email'],
        results: [
          {
            rowKey: 'b1',
            columnKey: 'email',
            claimToken: `${'a'.repeat(24)}:${'0'.repeat(14)}`,
            status: 'ok',
            value: 'x',
          },
        ],
        filter: { organization_id: 'org_b' },
      },
      connection: enrichmentConnection(collection),
      tenant,
    })
  ).rejects.toThrow('Tenant field "organization_id" can not be set in a filter');
  const docs = await readAll(collection);
  docs.forEach((doc) => expect(doc._enrich).toBeUndefined());
});

test('enrichment on a shared connection over a walled collection is scoped by its filter alone', async () => {
  const collection = 'tenantIsolationEnrichmentGuard';
  await populateTestMongoDb({ collection, documents: enrichmentDocs });
  const tenantGuard = { field: 'organization_id', readOnly: false };
  const scoped = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter: { organization_id: 'org_b' } },
    connection: enrichmentConnection(collection),
    tenantGuard,
  });
  expect(scoped).toMatchObject({ queued: 2 });
  let docs = await readAll(collection);
  expect(docs.filter((doc) => doc._enrich).map((doc) => doc._id)).toEqual(['b1', 'b2']);

  const unscoped = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter: {}, mode: 'errors' },
    connection: enrichmentConnection(collection),
    tenantGuard,
  });
  expect(unscoped).toMatchObject({ queued: 0 });
  docs = await readAll(collection);
  docs.forEach((doc) => {
    expect(doc.organization_id).toEqual(
      enrichmentDocs.find((row) => row._id === doc._id).organization_id
    );
  });
});
