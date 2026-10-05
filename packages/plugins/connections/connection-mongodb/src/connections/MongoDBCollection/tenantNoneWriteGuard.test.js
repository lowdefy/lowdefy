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

// The unscoped guards against the real server. Under tenant: none every
// resolver gets the read-only guard (and a null verdict, as the api passes it):
// it reads rows of every organization, and a write is refused before it
// touches the collection. A tenant: shared connection over a walled collection
// gets the write guard: a refused write must leave the collection exactly as
// it was, and a write the guard lets through must never leave a row the tenant
// preflight would refuse.

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from './MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBEnrichmentClaim from './MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from './MongoDBEnrichmentComplete/MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from './MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertManyConsecutiveIds from './MongoDBInsertManyConsecutiveIds/MongoDBInsertManyConsecutiveIds.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBTableChanges from './MongoDBTableChanges/MongoDBTableChanges.js';
import MongoDBTableQuery from './MongoDBTableQuery/MongoDBTableQuery.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import tenantPreflight from './tenant/tenantPreflight.js';
import { columnDefs, fields } from '../../../test/enrichmentTable.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const noneGuard = { field: 'organization_id', readOnly: true };
const sharedGuard = { field: 'organization_id', readOnly: false };
const readOnlyRefusal = 'writes, and a request with tenant: none may only read';
const readOnlyPipelineRefusal = 'An aggregation with tenant: none may only read, and';
const refusal = 'must leave "organization_id" a non-empty organization id on every row it writes';
const aggregationRefusal =
  'Unscoped aggregation on a walled collection (a tenant: shared connection over a collection a scoped connection reads) can not contain';
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
  ['an insert', MongoDBInsertOne, { doc: { _id: 'c1', organization_id: 'org_c' } }],
  [
    'an insert of many documents',
    MongoDBInsertMany,
    { docs: [{ _id: 'c1', organization_id: 'org_c' }] },
  ],
  [
    'a consecutive id insert',
    MongoDBInsertConsecutiveId,
    { doc: { organization_id: 'org_c' }, prefix: 'C', length: 3 },
  ],
  [
    'a consecutive ids insert',
    MongoDBInsertManyConsecutiveIds,
    { docs: [{ organization_id: 'org_c' }], prefix: 'C', length: 3 },
  ],
  ['an update', MongoDBUpdateOne, { filter: { _id: 'a1' }, update: { $set: { v: 'after' } } }],
  ['an update of many rows', MongoDBUpdateMany, { filter: {}, update: { $set: { v: 'after' } } }],
  [
    'a versioned update',
    MongoDBVersionedUpdateOne,
    { filter: { _id: 'a1' }, update: { $set: { v: 'after' } } },
  ],
  ['a delete', MongoDBDeleteOne, { filter: { _id: 'a1' } }],
  ['a delete of many rows', MongoDBDeleteMany, { filter: {} }],
  [
    'a bulkWrite',
    MongoDBBulkWrite,
    { operations: [{ updateOne: { filter: { _id: 'b1' }, update: { $set: { v: 'after' } } } }] },
  ],
  [
    'a table save',
    MongoDBTableChanges,
    { fields: { v: { type: 'text' } }, changes: { updated: { a1: { v: 'after' } } } },
  ],
])('tenant: none refuses %s and leaves the collection unchanged', async (_, resolver, request) => {
  const collection = 'tenantNoneReadOnlyWrite';
  await populateTestMongoDb({ collection, documents: seed });
  await expect(
    resolver({
      request,
      connection: makeConnection(collection),
      tenant: null,
      tenantGuard: noneGuard,
    })
  ).rejects.toThrow(readOnlyRefusal);
  expect(await readAll(collection)).toEqual(seed);
});

test.each([
  [
    'an aggregation that $merges into another collection',
    {
      pipeline: [
        { $project: { v: 1 } },
        { $merge: { into: 'tenantNoneReadOnlyMergeTarget', whenMatched: 'replace' } },
      ],
    },
    '"$merge"',
  ],
  [
    'an aggregation that $outs into another collection',
    { pipeline: [{ $project: { v: 1 } }, { $out: 'tenantNoneReadOnlyMergeTarget' }] },
    '"$out"',
  ],
  [
    'an aggregation with a $merge in a $lookup sub-pipeline',
    {
      pipeline: [
        {
          $lookup: {
            from: 'tenantNoneReadOnlyMerge',
            pipeline: [{ $merge: { into: 'tenantNoneReadOnlyMergeTarget' } }],
            as: 'joined',
          },
        },
      ],
    },
    '"$merge"',
  ],
])(
  'tenant: none refuses %s and leaves both collections unchanged',
  async (_, request, writeStage) => {
    const collection = 'tenantNoneReadOnlyMerge';
    const into = 'tenantNoneReadOnlyMergeTarget';
    await populateTestMongoDb({ collection, documents: seed });
    await populateTestMongoDb({ collection: into, documents: [{ _id: 'old' }] });
    await expect(
      MongoDBAggregation({
        request,
        connection: makeConnection(collection),
        tenant: null,
        tenantGuard: noneGuard,
      })
    ).rejects.toThrow(`${readOnlyPipelineRefusal} ${writeStage} writes its output`);
    expect(await readAll(collection)).toEqual(seed);
    expect(await readAll(into)).toEqual([{ _id: 'old' }]);
  }
);

test('tenant: none aggregations that only read still reach rows of every organization', async () => {
  const collection = 'tenantNoneReadOnlyAggregationRead';
  await populateTestMongoDb({ collection, documents: seed });
  const res = await MongoDBAggregation({
    request: { pipeline: [{ $sort: { _id: 1 } }, { $project: { organization_id: 1 } }] },
    connection: makeConnection(collection),
    tenant: null,
    tenantGuard: noneGuard,
  });
  expect(res).toEqual([
    { _id: 'a1', organization_id: 'org_a' },
    { _id: 'b1', organization_id: 'org_b' },
  ]);
});

// Two organizations share one leads table.
const leads = [
  { _id: 'a1', organization_id: 'org_a', name: 'Acme', domain: 'acme.test' },
  { _id: 'a2', organization_id: 'org_a', name: 'Arch', domain: 'arch.test' },
  { _id: 'b1', organization_id: 'org_b', name: 'Bolt', domain: 'bolt.test' },
  { _id: 'b2', organization_id: 'org_b', name: 'Bore', domain: 'bore.test' },
];
const scopedA = { tenant: { field: 'organization_id', value: 'org_a' }, tenantGuard: null };
const scopedB = { tenant: { field: 'organization_id', value: 'org_b' }, tenantGuard: null };
const none = { tenant: null, tenantGuard: noneGuard };
const shared = { tenant: null, tenantGuard: sharedGuard };

function leadsConnection(collection) {
  return { databaseUri, databaseName, collection, read: true, write: true };
}

function enqueueEmail({ collection, filter = {}, tenant, tenantGuard }) {
  return MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter },
    connection: leadsConnection(collection),
    tenant,
    tenantGuard,
  });
}

function claimEmail({ collection, filter = {}, tenant, tenantGuard }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, columns: ['email'], limit: 10, filter },
    connection: leadsConnection(collection),
    tenant,
    tenantGuard,
  });
}

function completeClaims({ collection, claims, filter = {}, tenant, tenantGuard }) {
  return MongoDBEnrichmentComplete({
    request: {
      columnDefs,
      filter,
      results: claims.map(({ rowKey, columnKey, claimToken }) => ({
        rowKey,
        columnKey,
        claimToken,
        status: 'ok',
        value: `${rowKey}@found.test`,
      })),
    },
    connection: leadsConnection(collection),
    tenant,
    tenantGuard,
  });
}

function cellOf(docs, _id, columnKey) {
  return docs.find((doc) => doc._id === _id)._enrich?.[columnKey];
}

async function expectLeadsInTheirOrganizations(collection) {
  const docs = await readAll(collection);
  expect(docs.map(({ _id, organization_id }) => [_id, organization_id])).toEqual(
    leads.map(({ _id, organization_id }) => [_id, organization_id])
  );
  await expect(
    tenantPreflight({ connection: leadsConnection(collection), field: 'organization_id' })
  ).resolves.toEqual({ ok: true });
  return docs;
}

test('tenant: none refuses an enrichment enqueue and queues no cell of any organization', async () => {
  const collection = 'tenantNoneReadOnlyEnrichmentEnqueue';
  await populateTestMongoDb({ collection, documents: leads });
  await expect(enqueueEmail({ collection, ...none })).rejects.toThrow(readOnlyRefusal);
  expect(await readAll(collection)).toEqual(leads);
});

test('tenant: none refuses an enrichment claim and leaves the queued cells of every organization queued', async () => {
  const collection = 'tenantNoneReadOnlyEnrichmentClaim';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, ...scopedA });
  await enqueueEmail({ collection, ...scopedB });
  const queued = await readAll(collection);
  await expect(claimEmail({ collection, ...none })).rejects.toThrow(readOnlyRefusal);
  expect(await readAll(collection)).toEqual(queued);
});

test('tenant: none refuses an enrichment complete and leaves the claimed cells of every organization running', async () => {
  const collection = 'tenantNoneReadOnlyEnrichmentComplete';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, ...scopedA });
  await enqueueEmail({ collection, ...scopedB });
  const claims = [
    ...(await claimEmail({ collection, ...scopedA })),
    ...(await claimEmail({ collection, ...scopedB })),
  ];
  expect(claims).toHaveLength(4);
  const claimed = await readAll(collection);
  await expect(completeClaims({ collection, claims, ...none })).rejects.toThrow(readOnlyRefusal);
  expect(await readAll(collection)).toEqual(claimed);
});

const leadFields = { name: { type: 'text' } };

test('tenant: none table query reads rows of every organization', async () => {
  const collection = 'tenantNoneReadOnlyTableQuery';
  await populateTestMongoDb({ collection, documents: leads });
  const res = await MongoDBTableQuery({
    request: {
      fields: leadFields,
      pipeline: [{ $project: { organization_id: 1, name: 1 } }],
      project: false,
    },
    connection: leadsConnection(collection),
    ...none,
  });
  expect(res.total).toBe(4);
  expect(res.rows.map(({ _id, organization_id }) => [_id, organization_id]).sort()).toEqual([
    ['a1', 'org_a'],
    ['a2', 'org_a'],
    ['b1', 'org_b'],
    ['b2', 'org_b'],
  ]);
});

test('tenant: none table query held to one organization by its base pipeline reads only that organization', async () => {
  const collection = 'tenantNoneReadOnlyTableQueryMatched';
  await populateTestMongoDb({ collection, documents: leads });
  const res = await MongoDBTableQuery({
    request: { fields: leadFields, pipeline: [{ $match: { organization_id: 'org_b' } }] },
    connection: leadsConnection(collection),
    ...none,
  });
  expect(res.total).toBe(2);
  expect(res.rows.map((row) => row._id).sort()).toEqual(['b1', 'b2']);
});

test('tenant: none refuses a table query with a $merge in a $lookup sub-pipeline and leaves the collection unchanged', async () => {
  const collection = 'tenantNoneReadOnlyTableQueryMerge';
  await populateTestMongoDb({ collection, documents: leads });
  await expect(
    MongoDBTableQuery({
      request: {
        fields: leadFields,
        pipeline: [
          {
            $lookup: {
              from: collection,
              pipeline: [{ $project: { name: 1 } }, { $merge: { into: collection } }],
              as: 'joined',
            },
          },
        ],
      },
      connection: leadsConnection(collection),
      ...none,
    })
  ).rejects.toThrow(`${readOnlyPipelineRefusal} "$merge"`);
  expect(await readAll(collection)).toEqual(leads);
});

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
    `${refusal} - the version copy carries null`,
  ],
  [
    'an aggregation that $merges org-less rows over its own collection',
    MongoDBAggregation,
    {
      pipeline: [
        { $project: { v: 1 } },
        { $merge: { into: 'sharedWriteGuardRefused', whenMatched: 'replace' } },
      ],
    },
    `${aggregationRefusal} "$merge"`,
  ],
  [
    'an aggregation that $outs org-less rows over its own collection',
    MongoDBAggregation,
    { pipeline: [{ $project: { v: 1 } }, { $out: 'sharedWriteGuardRefused' }] },
    `${aggregationRefusal} "$out"`,
  ],
])(
  'a shared connection over a walled collection refuses %s and leaves the collection unchanged',
  async (_, resolver, request, error) => {
    const collection = 'sharedWriteGuardRefused';
    await populateTestMongoDb({ collection, documents: seed });
    const connection = makeConnection(collection);
    await expect(resolver({ request, connection, ...shared })).rejects.toThrow(error);
    expect(await readAll(collection)).toEqual(seed);
  }
);

test('a shared connection over a walled collection writes rows of every organization that keep every row stamped', async () => {
  const collection = 'sharedWriteGuardAllowed';
  await populateTestMongoDb({ collection, documents: seed });
  const connection = makeConnection(collection);
  await MongoDBInsertOne({
    request: { doc: { _id: 'c1', doc_id: 'dc', organization_id: 'org_c', v: 'before' } },
    connection,
    ...shared,
  });
  await MongoDBUpdateMany({
    request: { filter: {}, update: { $set: { v: 'after' } } },
    connection,
    ...shared,
  });
  await MongoDBVersionedUpdateOne({
    request: { filter: { _id: 'b1' }, update: { $set: { v: 'versioned' } } },
    connection,
    ...shared,
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

test('a shared connection over a walled collection claims and completes enrichment cells of every organization and leaves each row in its organization', async () => {
  const collection = 'sharedWriteGuardEnrichment';
  await populateTestMongoDb({ collection, documents: leads });
  await expect(enqueueEmail({ collection, ...shared })).resolves.toMatchObject({ queued: 4 });
  const claims = await claimEmail({ collection, ...shared });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2', 'b1', 'b2']);
  await expect(completeClaims({ collection, claims, ...shared })).resolves.toMatchObject({
    applied: 4,
    ignored: 0,
  });
  const docs = await expectLeadsInTheirOrganizations(collection);
  ['a1', 'a2', 'b1', 'b2'].forEach((_id) => {
    expect(cellOf(docs, _id, 'email')).toMatchObject({ status: 'ok', value: `${_id}@found.test` });
    expect(cellOf(docs, _id, 'pitch').status).toBe('queued');
  });
});

test('a shared connection over a walled collection held to one organization by its filter claims and completes only that organization', async () => {
  const collection = 'sharedWriteGuardEnrichmentFiltered';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, ...shared });
  const claims = await claimEmail({ collection, filter: { organization_id: 'org_b' }, ...shared });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['b1', 'b2']);
  const docsAfterClaim = await readAll(collection);
  expect(cellOf(docsAfterClaim, 'a1', 'email').status).toBe('queued');
  const otherClaims = await claimEmail({ collection, ...shared });
  expect(otherClaims.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2']);
  await expect(
    completeClaims({
      collection,
      claims: [...claims, ...otherClaims],
      filter: { organization_id: 'org_a' },
      ...shared,
    })
  ).resolves.toMatchObject({ applied: 2, ignored: 2 });
  const docs = await expectLeadsInTheirOrganizations(collection);
  expect(cellOf(docs, 'a1', 'email').status).toBe('ok');
  expect(cellOf(docs, 'a2', 'email').status).toBe('ok');
  expect(cellOf(docs, 'b1', 'email').status).toBe('running');
  expect(cellOf(docs, 'b2', 'email').status).toBe('running');
});

test('enrichment claims racing over two organizations on a shared connection never claim one cell twice', async () => {
  const collection = 'sharedWriteGuardEnrichmentRace';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, ...shared });
  const [first, second] = await Promise.all([
    claimEmail({ collection, ...shared }),
    claimEmail({ collection, ...shared }),
  ]);
  const claimed = [...first, ...second].map((claim) => claim.rowKey).sort();
  expect(claimed).toEqual(['a1', 'a2', 'b1', 'b2']);
  await expectLeadsInTheirOrganizations(collection);
});
