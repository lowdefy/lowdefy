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
import MongoDBEnrichmentClaim from './MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from './MongoDBEnrichmentComplete/MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from './MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
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
const tenantGuard = { field: 'organization_id' };
const refusal = 'must leave "organization_id" a non-empty organization id on every row it writes';
const aggregationRefusal =
  'Unscoped aggregation on a walled collection (tenant: none, or a tenant: shared connection over a collection a scoped connection reads) can not contain';
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
    `${refusal} - the version copy carries null`,
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

// Two organizations share one leads table.
const leads = [
  { _id: 'a1', organization_id: 'org_a', name: 'Acme', domain: 'acme.test' },
  { _id: 'a2', organization_id: 'org_a', name: 'Arch', domain: 'arch.test' },
  { _id: 'b1', organization_id: 'org_b', name: 'Bolt', domain: 'bolt.test' },
  { _id: 'b2', organization_id: 'org_b', name: 'Bore', domain: 'bore.test' },
];

function leadsConnection(collection) {
  return { databaseUri, databaseName, collection, read: true, write: true };
}

function enqueueEmail({ collection, filter }) {
  return MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter },
    connection: leadsConnection(collection),
    tenant: null,
    tenantGuard,
  });
}

function claimEmail({ collection, filter }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, columns: ['email'], limit: 10, filter },
    connection: leadsConnection(collection),
    tenant: null,
    tenantGuard,
  });
}

function completeClaims({ collection, claims, filter }) {
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
    tenant: null,
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

test('tenant: none enrichment claim takes queued cells of every organization and leaves each row in its organization', async () => {
  const collection = 'tenantNoneWriteGuardEnrichmentClaim';
  await populateTestMongoDb({ collection, documents: leads });
  await expect(enqueueEmail({ collection, filter: {} })).resolves.toMatchObject({ queued: 4 });
  const claims = await claimEmail({ collection, filter: {} });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2', 'b1', 'b2']);
  const docs = await expectLeadsInTheirOrganizations(collection);
  ['a1', 'a2', 'b1', 'b2'].forEach((_id) => {
    expect(cellOf(docs, _id, 'email').status).toBe('running');
  });
});

test('tenant: none enrichment claim held to one organization by its filter leaves the other queued', async () => {
  const collection = 'tenantNoneWriteGuardEnrichmentClaimFiltered';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, filter: {} });
  const claims = await claimEmail({ collection, filter: { organization_id: 'org_b' } });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['b1', 'b2']);
  const docs = await expectLeadsInTheirOrganizations(collection);
  expect(cellOf(docs, 'a1', 'email').status).toBe('queued');
  expect(cellOf(docs, 'a2', 'email').status).toBe('queued');
  expect(cellOf(docs, 'b1', 'email').status).toBe('running');
});

test('tenant: none enrichment claims racing over two organizations never claim one cell twice', async () => {
  const collection = 'tenantNoneWriteGuardEnrichmentClaimRace';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, filter: {} });
  const [first, second] = await Promise.all([
    claimEmail({ collection, filter: {} }),
    claimEmail({ collection, filter: {} }),
  ]);
  const claimed = [...first, ...second].map((claim) => claim.rowKey).sort();
  expect(claimed).toEqual(['a1', 'a2', 'b1', 'b2']);
  await expectLeadsInTheirOrganizations(collection);
});

test('tenant: none enrichment complete writes results to rows of every organization and leaves each row in its organization', async () => {
  const collection = 'tenantNoneWriteGuardEnrichmentComplete';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, filter: {} });
  const claims = await claimEmail({ collection, filter: {} });
  await expect(completeClaims({ collection, claims, filter: {} })).resolves.toMatchObject({
    applied: 4,
    ignored: 0,
  });
  const docs = await expectLeadsInTheirOrganizations(collection);
  ['a1', 'a2', 'b1', 'b2'].forEach((_id) => {
    expect(cellOf(docs, _id, 'email')).toMatchObject({ status: 'ok', value: `${_id}@found.test` });
    expect(cellOf(docs, _id, 'pitch').status).toBe('queued');
  });
});

test("tenant: none enrichment complete held to one organization by its filter ignores the other's claims", async () => {
  const collection = 'tenantNoneWriteGuardEnrichmentCompleteFiltered';
  await populateTestMongoDb({ collection, documents: leads });
  await enqueueEmail({ collection, filter: {} });
  const claims = await claimEmail({ collection, filter: {} });
  await expect(
    completeClaims({ collection, claims, filter: { organization_id: 'org_a' } })
  ).resolves.toMatchObject({ applied: 2, ignored: 2 });
  const docs = await expectLeadsInTheirOrganizations(collection);
  expect(cellOf(docs, 'a1', 'email').status).toBe('ok');
  expect(cellOf(docs, 'a2', 'email').status).toBe('ok');
  expect(cellOf(docs, 'b1', 'email').status).toBe('running');
  expect(cellOf(docs, 'b2', 'email').status).toBe('running');
});

const leadFields = { name: { type: 'text' } };

test('tenant: none table query reads rows of every organization', async () => {
  const collection = 'tenantNoneWriteGuardTableQuery';
  await populateTestMongoDb({ collection, documents: leads });
  const res = await MongoDBTableQuery({
    request: {
      fields: leadFields,
      pipeline: [{ $project: { organization_id: 1, name: 1 } }],
      project: false,
    },
    connection: leadsConnection(collection),
    tenant: null,
    tenantGuard,
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
  const collection = 'tenantNoneWriteGuardTableQueryMatched';
  await populateTestMongoDb({ collection, documents: leads });
  const res = await MongoDBTableQuery({
    request: { fields: leadFields, pipeline: [{ $match: { organization_id: 'org_b' } }] },
    connection: leadsConnection(collection),
    tenant: null,
    tenantGuard,
  });
  expect(res.total).toBe(2);
  expect(res.rows.map((row) => row._id).sort()).toEqual(['b1', 'b2']);
});

test('tenant: none refuses a table query with a $merge in a $lookup sub-pipeline and leaves the collection unchanged', async () => {
  const collection = 'tenantNoneWriteGuardTableQueryMerge';
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
      tenant: null,
      tenantGuard,
    })
  ).rejects.toThrow(`${aggregationRefusal} "$merge"`);
  expect(await readAll(collection)).toEqual(leads);
});
