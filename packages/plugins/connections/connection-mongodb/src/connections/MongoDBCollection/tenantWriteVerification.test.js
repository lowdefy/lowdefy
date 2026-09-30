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

// Every insert-capable request is checked against the row as stored. The wall's
// own stamping is replaced here with a stamper that "forgets" the tenant field
// (as a bug would), so what reaches the database is an org-less row - the
// verification must delete it and fail the request with TenantIntegrityError.

import { jest } from '@jest/globals';
import { TenantIntegrityError } from '@lowdefy/errors';

jest.unstable_mockModule('./tenant/stampTenantOnDoc.js', () => ({
  default: ({ doc }) => doc,
}));
jest.unstable_mockModule('./tenant/applyTenantToBulkOperations.js', () => ({
  default: ({ operations }) => operations,
}));
jest.unstable_mockModule('./tenant/applyTenantToFilter.js', () => ({
  default: ({ filter }) => filter,
}));
jest.unstable_mockModule('./tenant/applyTenantToUpdate.js', () => ({
  default: ({ update }) => update,
}));

const { default: MongoDBBulkWrite } = await import('./MongoDBBulkWrite/MongoDBBulkWrite.js');
const { default: MongoDBInsertMany } = await import('./MongoDBInsertMany/MongoDBInsertMany.js');
const { default: MongoDBInsertOne } = await import('./MongoDBInsertOne/MongoDBInsertOne.js');
const { default: MongoDBTableChanges } = await import(
  './MongoDBTableChanges/MongoDBTableChanges.js'
);
const { default: MongoDBUpdateOne } = await import('./MongoDBUpdateOne/MongoDBUpdateOne.js');
const { default: MongoDBUpdateMany } = await import('./MongoDBUpdateMany/MongoDBUpdateMany.js');
const { default: getTestCollection } = await import('../../../test/getTestCollection.js');
const { default: populateTestMongoDb } = await import('../../../test/populateTestMongoDb.js');

const databaseUri = process.env.MONGO_URL;
const tenant = { field: 'organization_id', value: 'org_a' };

function makeConnection(collection) {
  return { databaseUri, databaseName: 'test', collection, write: true };
}

async function readAll(collection) {
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const docs = await testCollection.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs;
}

const base = { connectionId: 'conn', endpointId: 'save', requestId: 'req' };
const seeded = [{ _id: 'existing', organization_id: 'org_b' }];

test('insertOne of an org-less row is deleted and throws TenantIntegrityError', async () => {
  const collection = 'writeVerifyInsertOne';
  await populateTestMongoDb({ collection, documents: seeded });
  const error = await MongoDBInsertOne({
    ...base,
    request: { doc: { _id: 'new', v: 1 } },
    connection: makeConnection(collection),
    tenant,
  }).catch((e) => e);
  expect(error).toBeInstanceOf(TenantIntegrityError);
  expect(error.collection).toBe(collection);
  expect(error.organizationId).toBe('org_a');
  expect(error.endpointId).toBe('save');
  expect(await readAll(collection)).toEqual(seeded);
});

test('insertMany deletes every offending row and leaves the other org untouched', async () => {
  const collection = 'writeVerifyInsertMany';
  await populateTestMongoDb({ collection, documents: seeded });
  await expect(
    MongoDBInsertMany({
      ...base,
      request: { docs: [{ _id: 'n1' }, { _id: 'n2', organization_id: 'org_b' }] },
      connection: makeConnection(collection),
      tenant,
    })
  ).rejects.toBeInstanceOf(TenantIntegrityError);
  expect(await readAll(collection)).toEqual(seeded);
});

test('bulkWrite insertOne of a wrong-org row is deleted', async () => {
  const collection = 'writeVerifyBulk';
  await populateTestMongoDb({ collection, documents: seeded });
  await expect(
    MongoDBBulkWrite({
      ...base,
      request: {
        operations: [{ insertOne: { document: { _id: 'n1', organization_id: 'org_b' } } }],
      },
      connection: makeConnection(collection),
      tenant,
    })
  ).rejects.toBeInstanceOf(TenantIntegrityError);
  expect(await readAll(collection)).toEqual(seeded);
});

test('an upsert that inserted an org-less row is deleted (updateOne and updateMany)', async () => {
  const collection = 'writeVerifyUpsert';
  await populateTestMongoDb({ collection, documents: seeded });
  await expect(
    MongoDBUpdateOne({
      ...base,
      request: { filter: { _id: 'u1' }, update: { $set: { v: 1 } }, options: { upsert: true } },
      connection: makeConnection(collection),
      tenant,
    })
  ).rejects.toBeInstanceOf(TenantIntegrityError);
  await expect(
    MongoDBUpdateMany({
      ...base,
      request: { filter: { _id: 'u2' }, update: { $set: { v: 1 } }, options: { upsert: true } },
      connection: makeConnection(collection),
      tenant,
    })
  ).rejects.toBeInstanceOf(TenantIntegrityError);
  expect(await readAll(collection)).toEqual(seeded);
});

test('an upsert that only matched an existing row does not verify or delete anything', async () => {
  const collection = 'writeVerifyUpsertMatched';
  await populateTestMongoDb({ collection, documents: [{ _id: 'existing' }] });
  await MongoDBUpdateOne({
    ...base,
    request: { filter: { _id: 'existing' }, update: { $set: { v: 1 } }, options: { upsert: true } },
    connection: makeConnection(collection),
    tenant,
  });
  expect(await readAll(collection)).toEqual([{ _id: 'existing', v: 1 }]);
});

test('under tenant: none a well-formed authored upsert is kept, nothing extra happens', async () => {
  const collection = 'writeVerifyGuard';
  await populateTestMongoDb({ collection, documents: seeded });
  await MongoDBBulkWrite({
    ...base,
    request: {
      operations: [
        {
          updateOne: {
            filter: { _id: 'g1' },
            update: [{ $set: { organization_id: { $literal: 'org_z' } } }],
            upsert: true,
          },
        },
      ],
    },
    connection: makeConnection(collection),
    tenantGuard: { field: 'organization_id' },
  });
  expect((await readAll(collection)).map((d) => d._id)).toEqual(['existing', 'g1']);
});

test('tableChanges: an added row stored without the tenant field is deleted', async () => {
  const collection = 'writeVerifyTableChanges';
  await populateTestMongoDb({ collection, documents: seeded });
  await expect(
    MongoDBTableChanges({
      ...base,
      request: {
        fields: { item: { type: 'text' } },
        filter: {},
        changes: { added: [{ rowKey: 'tmp', item: 'Orphan' }] },
      },
      connection: makeConnection(collection),
      tenant,
    })
  ).rejects.toBeInstanceOf(TenantIntegrityError);
  expect(await readAll(collection)).toEqual(seeded);
});
