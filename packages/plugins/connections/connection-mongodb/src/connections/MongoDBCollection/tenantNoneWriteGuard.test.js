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

// The tenant: none write guard against the real server: every resolver gets
// the guard (and a null verdict, as the api passes it), and a refused write
// must leave the collection exactly as it was. A write the guard lets through
// must never leave a row the tenant preflight would refuse.

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from './MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import tenantPreflight from './tenant/tenantPreflight.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const tenantGuard = { field: 'organization_id' };
const refusal = 'Unscoped write (tenant: none) on a tenant connection must leave "organization_id"';
const aggregationRefusal =
  'Unscoped aggregation (tenant: none) on a tenant connection can not contain';
const seed = [
  { _id: 'a1', doc_id: 'da', organization_id: 'org_a', v: 'before' },
  { _id: 'b1', doc_id: 'db', organization_id: 'org_b', v: 'before' },
];

function makeConnection(collection) {
  return { databaseUri, databaseName, collection, write: true };
}

async function readAll(collection) {
  const { collection: testCollection, client } = await getTestCollection({ collection });
  const docs = await testCollection.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs;
}

test.each([
  ['an insert without an organization id', MongoDBInsertOne, { doc: { _id: 'n1', v: 1 } }, refusal],
  [
    'a bulkWrite operation carrying a second kind the driver runs instead',
    MongoDBBulkWrite,
    {
      operations: [
        {
          deleteOne: { filter: { _id: 'none' } },
          insertOne: { document: { _id: 'n1', organization_id: null } },
        },
      ],
    },
    'bulkWrite operation 0 on a tenant connection must name exactly one operation kind',
  ],
  [
    'a pipeline update projecting only _id',
    MongoDBUpdateOne,
    { filter: { _id: 'a1' }, update: [{ $project: { _id: 1 } }] },
    refusal,
  ],
  [
    'an upsert that authors no organization id',
    MongoDBUpdateOne,
    { filter: { doc_id: 'dn' }, update: { $set: { v: 'new' } }, options: { upsert: true } },
    refusal,
  ],
  [
    'a versioned update whose find projection drops the organization id',
    MongoDBVersionedUpdateOne,
    {
      filter: { _id: 'a1' },
      update: { $set: { v: 'after' } },
      options: { find: { projection: { organization_id: 0 } } },
    },
    `${refusal} a non-empty organization id on every row it writes - the version copy carries null`,
  ],
  [
    'an aggregation that $merges org-less rows over its own collection',
    MongoDBAggregation,
    {
      pipeline: [
        { $project: { v: 1 } },
        { $merge: { into: 'tenantNoneWriteGuardRefused', whenMatched: 'replace' } },
      ],
    },
    `${aggregationRefusal} "$merge"`,
  ],
  [
    'an aggregation that $outs org-less rows over its own collection',
    MongoDBAggregation,
    { pipeline: [{ $project: { v: 1 } }, { $out: 'tenantNoneWriteGuardRefused' }] },
    `${aggregationRefusal} "$out"`,
  ],
  [
    'an aggregation with a $merge in a $lookup sub-pipeline',
    MongoDBAggregation,
    {
      pipeline: [
        {
          $lookup: {
            from: 'tenantNoneWriteGuardRefused',
            pipeline: [{ $merge: { into: 'tenantNoneWriteGuardRefused' } }],
            as: 'joined',
          },
        },
      ],
    },
    `${aggregationRefusal} "$merge"`,
  ],
])(
  'tenant: none refuses %s and leaves the collection unchanged',
  async (_, resolver, request, error) => {
    const collection = 'tenantNoneWriteGuardRefused';
    await populateTestMongoDb({ collection, documents: seed });
    const connection = makeConnection(collection);
    await expect(resolver({ request, connection, tenant: null, tenantGuard })).rejects.toThrow(
      error
    );
    expect(await readAll(collection)).toEqual(seed);
  }
);

test('tenant: none writes that keep every row stamped reach rows of every organization', async () => {
  const collection = 'tenantNoneWriteGuardAllowed';
  await populateTestMongoDb({ collection, documents: seed });
  const connection = makeConnection(collection);
  await MongoDBInsertOne({
    request: { doc: { _id: 'c1', doc_id: 'dc', organization_id: 'org_c', v: 'before' } },
    connection,
    tenant: null,
    tenantGuard,
  });
  await MongoDBUpdateMany({
    request: { filter: {}, update: { $set: { v: 'after' } } },
    connection,
    tenant: null,
    tenantGuard,
  });
  await MongoDBVersionedUpdateOne({
    request: { filter: { _id: 'b1' }, update: { $set: { v: 'versioned' } } },
    connection,
    tenant: null,
    tenantGuard,
  });
  const docs = await readAll(collection);
  expect(docs.map(({ organization_id, v }) => [organization_id, v]).sort()).toEqual([
    ['org_a', 'after'],
    ['org_b', 'after'],
    ['org_b', 'versioned'],
    ['org_c', 'after'],
  ]);
  await expect(tenantPreflight({ connection, field: 'organization_id' })).resolves.toEqual({
    ok: true,
  });
});

test('tenant: none aggregations that only read still reach rows of every organization', async () => {
  const collection = 'tenantNoneWriteGuardAggregationRead';
  await populateTestMongoDb({ collection, documents: seed });
  const res = await MongoDBAggregation({
    request: { pipeline: [{ $sort: { _id: 1 } }, { $project: { organization_id: 1 } }] },
    connection: makeConnection(collection),
    tenant: null,
    tenantGuard,
  });
  expect(res).toEqual([
    { _id: 'a1', organization_id: 'org_a' },
    { _id: 'b1', organization_id: 'org_b' },
  ]);
});

test('an aggregation without the tenant guard still runs its $merge', async () => {
  const collection = 'tenantNoneWriteGuardUnguardedMerge';
  const into = 'tenantNoneWriteGuardUnguardedMergeTarget';
  await populateTestMongoDb({ collection, documents: seed });
  await populateTestMongoDb({ collection: into, documents: [{ _id: 'old' }] });
  await MongoDBAggregation({
    request: { pipeline: [{ $project: { v: 1 } }, { $merge: { into } }] },
    connection: makeConnection(collection),
    tenant: null,
    tenantGuard: null,
  });
  expect(await readAll(into)).toEqual([
    { _id: 'a1', v: 'before' },
    { _id: 'b1', v: 'before' },
    { _id: 'old' },
  ]);
});
