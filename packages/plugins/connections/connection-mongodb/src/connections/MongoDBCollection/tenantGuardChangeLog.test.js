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

// Change logs of unscoped writes, against the real server. A log record is
// usually read through a walled connection, so on a scoped connection every
// record carries the organization of the caller's verdict. A tenant: shared
// connection over a walled collection writes records that belong to no
// organization (its change log can not point into a walled collection - the
// build refuses it), so they stay unstamped. A tenant: none request only
// reads, so it writes neither a row nor a log record.

import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBEnrichmentClaim from './MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from './MongoDBEnrichmentComplete/MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from './MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBTableChanges from './MongoDBTableChanges/MongoDBTableChanges.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import tenantPreflight from './tenant/tenantPreflight.js';
import { columnDefs, fields } from '../../../test/enrichmentTable.js';
import getTestCollection from '../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../test/populateTestMongoDb.js';

const databaseUri = process.env.MONGO_URL;
const databaseName = 'test';
const field = 'organization_id';
const noneGuard = { field, readOnly: true };
const sharedGuard = { field, readOnly: false };
const seed = [
  { _id: 'a1', organization_id: 'org_a', v: 'before' },
  { _id: 'a2', organization_id: 'org_a', v: 'before' },
  { _id: 'b1', organization_id: 'org_b', v: 'before' },
];

let run = 0;

async function setup(documents = seed) {
  run += 1;
  const collection = `tenantChangeLog${run}`;
  const logCollection = `${collection}Log`;
  await populateTestMongoDb({ collection, documents });
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
  ['an insert', MongoDBInsertOne, { doc: { _id: 'c1', organization_id: 'org_c' } }],
  ['an update', MongoDBUpdateOne, { filter: { _id: 'b1' }, update: { $set: { v: 'after' } } }],
  [
    'an update of many rows',
    MongoDBUpdateMany,
    { filter: { organization_id: 'org_a' }, update: { $set: { v: 'after' } } },
  ],
  ['a delete', MongoDBDeleteOne, { filter: { _id: 'b1' } }],
])(
  'tenant: none refuses %s on a change-logged connection and writes no log record',
  async (_, resolver, request) => {
    const { collection, logCollection, connection } = await setup();
    await expect(
      resolver({ request, connection, tenant: null, tenantGuard: noneGuard })
    ).rejects.toThrow('writes, and a request with tenant: none may only read');
    expect(await readAll(collection)).toEqual(seed);
    expect(await logRecords(logCollection)).toEqual([]);
  }
);

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

// The table and enrichment writes on one leads table that two organizations share. Each
// request is called as a scoped connection (the caller's organization verdict) and as a
// shared connection over a walled collection.
const leads = [
  { _id: 'a1', organization_id: 'org_a', name: 'Acme', domain: 'acme.test' },
  { _id: 'a2', organization_id: 'org_a', name: 'Arch', domain: 'arch.test' },
  { _id: 'b1', organization_id: 'org_b', name: 'Bolt', domain: 'bolt.test' },
  { _id: 'b2', organization_id: 'org_b', name: 'Bore', domain: 'bore.test' },
];
const leadFields = { name: { type: 'text' } };
const scopedA = { tenant: { field, value: 'org_a' }, tenantGuard: null };
const sharedB = { tenant: null, tenantGuard: sharedGuard, filter: { organization_id: 'org_b' } };

function enqueueEmail({ connection, tenant, tenantGuard, filter }) {
  return MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter },
    connection: { ...connection, read: true },
    tenant,
    tenantGuard,
  });
}

function claimEmail({ connection, tenant, tenantGuard, filter }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, columns: ['email'], limit: 10, filter },
    connection: { ...connection, read: true },
    tenant,
    tenantGuard,
  });
}

function completeClaims({ connection, tenant, tenantGuard, filter, claims }) {
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
    connection,
    tenant,
    tenantGuard,
  });
}

function saveTable({ connection, tenant, tenantGuard, filter, insertDefaults, changes }) {
  return MongoDBTableChanges({
    request: { fields: leadFields, filter, insertDefaults, changes },
    connection,
    tenant,
    tenantGuard,
  });
}

async function runEnrichment(context) {
  await enqueueEmail(context);
  const claims = await claimEmail(context);
  await completeClaims({ ...context, claims });
  return claims;
}

function recordsByType(records) {
  return records.map((record) => [record.type, record[field]]);
}

test('enrichment writes on a scoped connection stamp each change-log record with the organization they ran for', async () => {
  const { collection, logCollection, connection } = await setup(leads);
  const claims = await runEnrichment({ ...scopedA, connection });
  expect(claims.map((claim) => claim.rowKey).sort()).toEqual(['a1', 'a2']);
  expect(recordsByType(await logRecords(logCollection))).toEqual([
    ['MongoDBEnrichmentEnqueue', 'org_a'],
    ['MongoDBEnrichmentClaim', 'org_a'],
    ['MongoDBEnrichmentComplete', 'org_a'],
  ]);
  const docs = await readAll(collection);
  docs
    .filter((doc) => !['a1', 'a2'].includes(doc._id))
    .forEach((doc) => expect(doc._enrich).toBeUndefined());
  await expect(
    tenantPreflight({ connection: { ...connection, collection: logCollection }, field })
  ).resolves.toEqual({ ok: true });
});

test('a table save on a scoped connection stamps its change-log record with the organization it ran for', async () => {
  const { collection, logCollection, connection } = await setup(leads);
  const saved = await saveTable({
    ...scopedA,
    connection,
    changes: { updated: { a1: { name: 'Acme 2' } }, added: [{ rowKey: 'new', name: 'Ajax' }] },
  });
  expect(recordsByType(await logRecords(logCollection))).toEqual([
    ['MongoDBTableChanges', 'org_a'],
  ]);
  const added = (await readAll(collection)).find(
    (doc) => String(doc._id) === saved.insertedKeys.new._oid
  );
  expect(added[field]).toBe('org_a');
  await expect(
    tenantPreflight({ connection: { ...connection, collection: logCollection }, field })
  ).resolves.toEqual({ ok: true });
});

test('table and enrichment writes on a shared connection over a walled collection leave their change-log records unstamped', async () => {
  const { collection, logCollection, connection } = await setup(leads);
  await runEnrichment({ ...sharedB, connection });
  await saveTable({
    ...sharedB,
    connection,
    insertDefaults: { organization_id: 'org_b' },
    changes: { updated: { b1: { name: 'Bolt 2' } }, added: [{ rowKey: 'new', name: 'Brio' }] },
  });
  const records = await logRecords(logCollection);
  expect(records.map((record) => record.type)).toEqual([
    'MongoDBEnrichmentEnqueue',
    'MongoDBEnrichmentClaim',
    'MongoDBEnrichmentComplete',
    'MongoDBTableChanges',
  ]);
  records.forEach((record) => expect(record).not.toHaveProperty(field));
  const docs = await readAll(collection);
  expect(docs.filter((doc) => doc._enrich).map((doc) => doc._id)).toEqual(['b1', 'b2']);
  expect(docs.every((doc) => doc[field] !== undefined)).toBe(true);
});
