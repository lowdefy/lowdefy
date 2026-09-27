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

// Change logs under the unscoped write guard, against the real server. A
// tenant: none write on a change-logged connection writes a log record that
// is usually read through a walled connection, so every record must carry the
// organization of the rows it records - the log collection must pass the
// tenant preflight after any write the guard lets through. A write that can
// reach rows of several organizations has no organization to stamp and is
// refused before it writes anything.

import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertManyConsecutiveIds from './MongoDBInsertManyConsecutiveIds/MongoDBInsertManyConsecutiveIds.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import tenantPreflight from './tenant/tenantPreflight.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const field = 'organization_id';
const noneGuard = { field, stampChangeLog: true };
const sharedGuard = { field, stampChangeLog: false };
const seed = [
  { _id: 'a1', organization_id: 'org_a', v: 'before' },
  { _id: 'a2', organization_id: 'org_a', v: 'before' },
  { _id: 'b1', organization_id: 'org_b', v: 'before' },
];
const refusal =
  'Unscoped write (tenant: none) on a change-logged tenant connection must write rows of one organization';

let run = 0;

async function setup() {
  run += 1;
  const collection = `tenantChangeLog${run}`;
  const logCollection = `${collection}Log`;
  await populateTestMongoDb({ collection, documents: seed });
  await populateTestMongoDb({
    collection: logCollection,
    documents: [{ _id: 'marker', [field]: 'org_x' }],
  });
  const connection = {
    databaseUri,
    databaseName,
    collection,
    changeLog: { collection: logCollection },
    write: true,
  };
  return { collection, logCollection, connection };
}

async function readAll(collection) {
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const docs = await testCollection.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs;
}

async function logRecords(logCollection) {
  const records = await readAll(logCollection);
  return records.filter((record) => record._id !== 'marker');
}

test.each([
  ['an insert', MongoDBInsertOne, { doc: { _id: 'c1', organization_id: 'org_c' } }, 'org_c'],
  [
    'a consecutive id insert',
    MongoDBInsertConsecutiveId,
    { doc: { organization_id: 'org_c' }, prefix: 'C', length: 3 },
    'org_c',
  ],
  [
    'an insert of many documents of one organization',
    MongoDBInsertMany,
    { docs: [{ organization_id: 'org_c' }, { organization_id: 'org_c' }] },
    'org_c',
  ],
  [
    'a consecutive ids insert of one organization',
    MongoDBInsertManyConsecutiveIds,
    { docs: [{ organization_id: 'org_c' }, { organization_id: 'org_c' }], prefix: 'C', length: 3 },
    'org_c',
  ],
  [
    'an update',
    MongoDBUpdateOne,
    { filter: { _id: 'b1' }, update: { $set: { v: 'after' } } },
    'org_b',
  ],
  [
    'an update that moves the row to another organization',
    MongoDBUpdateOne,
    { filter: { _id: 'b1' }, update: { $set: { organization_id: 'org_c' } } },
    'org_c',
  ],
  [
    'an upsert',
    MongoDBUpdateOne,
    {
      filter: { _id: 'c1' },
      update: { $set: { organization_id: 'org_c' } },
      options: { upsert: true },
    },
    'org_c',
  ],
  [
    'a versioned update',
    MongoDBVersionedUpdateOne,
    { filter: { _id: 'b1' }, update: { $set: { v: 'after' } } },
    'org_b',
  ],
  ['a delete', MongoDBDeleteOne, { filter: { _id: 'b1' } }, 'org_b'],
  [
    'an update of many rows matched to one organization',
    MongoDBUpdateMany,
    { filter: { organization_id: 'org_a' }, update: { $set: { v: 'after' } } },
    'org_a',
  ],
  [
    'a delete of many rows matched to one organization by $eq',
    MongoDBDeleteMany,
    { filter: { organization_id: { $eq: 'org_a' } } },
    'org_a',
  ],
])(
  'tenant: none stamps the change-log record of %s with the organization of its rows',
  async (_, resolver, request, organizationId) => {
    const { logCollection, connection } = await setup();
    await resolver({ request, connection, tenant: null, tenantGuard: noneGuard });
    const records = await logRecords(logCollection);
    expect(records.map((record) => record[field])).toEqual([organizationId]);
    await expect(
      tenantPreflight({ connection: { ...connection, collection: logCollection }, field })
    ).resolves.toEqual({ ok: true });
  }
);

test.each([
  [
    'an update',
    MongoDBUpdateOne,
    { filter: { _id: 'none' }, update: { $set: { v: 'after' } }, disableNoMatchError: true },
  ],
  [
    'a versioned update',
    MongoDBVersionedUpdateOne,
    { filter: { _id: 'none' }, update: { $set: { v: 'after' } }, disableNoMatchError: true },
  ],
  ['a delete', MongoDBDeleteOne, { filter: { _id: 'none' } }],
])(
  'tenant: none writes no change-log record for %s that matched no row',
  async (_, resolver, request) => {
    const { logCollection, connection } = await setup();
    await resolver({ request, connection, tenant: null, tenantGuard: noneGuard });
    expect(await logRecords(logCollection)).toEqual([]);
  }
);

test.each([
  [
    'an insert of documents of two organizations',
    MongoDBInsertMany,
    { docs: [{ organization_id: 'org_a' }, { organization_id: 'org_b' }] },
    'the documents carry ["org_a","org_b"]',
  ],
  [
    'a consecutive ids insert of two organizations',
    MongoDBInsertManyConsecutiveIds,
    { docs: [{ organization_id: 'org_a' }, { organization_id: 'org_b' }], prefix: 'C', length: 3 },
    'the documents carry ["org_a","org_b"]',
  ],
  [
    'an update of many rows the filter does not hold to one organization',
    MongoDBUpdateMany,
    { filter: {}, update: { $set: { v: 'after' } } },
    'the filter does not match "organization_id" by equality to one organization id',
  ],
  [
    'an update of many rows that moves them to another organization',
    MongoDBUpdateMany,
    { filter: { organization_id: 'org_a' }, update: { $set: { organization_id: 'org_b' } } },
    'the update writes "organization_id"',
  ],
  [
    'a delete of many rows the filter matches by $in',
    MongoDBDeleteMany,
    { filter: { organization_id: { $in: ['org_a', 'org_b'] } } },
    'the filter does not match "organization_id" by equality to one organization id',
  ],
])(
  'tenant: none refuses %s on a change-logged connection before it writes',
  async (_, resolver, request, detail) => {
    const { collection, logCollection, connection } = await setup();
    await expect(
      resolver({ request, connection, tenant: null, tenantGuard: noneGuard })
    ).rejects.toThrow(`${refusal} - ${detail}`);
    expect(await readAll(collection)).toEqual(seed);
    expect(await logRecords(logCollection)).toEqual([]);
  }
);

test('tenant: none writes many rows of several organizations when the connection has no change log', async () => {
  const { collection, connection } = await setup();
  await MongoDBUpdateMany({
    request: { filter: {}, update: { $set: { v: 'after' } } },
    connection: { ...connection, changeLog: undefined },
    tenant: null,
    tenantGuard: noneGuard,
  });
  expect((await readAll(collection)).map((doc) => doc.v)).toEqual(['after', 'after', 'after']);
});

test('a shared connection over a walled collection writes many organizations and leaves its change log unstamped', async () => {
  const { collection, logCollection, connection } = await setup();
  await MongoDBInsertMany({
    request: {
      docs: [
        { _id: 'c1', organization_id: 'org_c' },
        { _id: 'd1', organization_id: 'org_d' },
      ],
    },
    connection,
    tenant: null,
    tenantGuard: sharedGuard,
  });
  expect((await readAll(collection)).map((doc) => doc.organization_id)).toEqual([
    'org_a',
    'org_a',
    'org_b',
    'org_c',
    'org_d',
  ]);
  const records = await logRecords(logCollection);
  expect(records).toHaveLength(1);
  expect(records[0]).not.toHaveProperty(field);
});

test('a shared connection over a walled collection refuses a row without an organization', async () => {
  const { collection, connection } = await setup();
  await expect(
    MongoDBInsertOne({
      request: { doc: { _id: 'c1', v: 'orphan' } },
      connection,
      tenant: null,
      tenantGuard: sharedGuard,
    })
  ).rejects.toThrow(
    'must leave "organization_id" a non-empty organization id on every row it writes'
  );
  expect(await readAll(collection)).toEqual(seed);
});
