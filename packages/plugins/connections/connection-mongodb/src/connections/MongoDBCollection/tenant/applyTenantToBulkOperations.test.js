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

import applyTenantToBulkOperations from './applyTenantToBulkOperations.js';

const tenant = { field: 'organization_id', value: 'org_a' };

test('insertOne document is stamped', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ insertOne: { document: { name: 'x' } } }],
      tenant,
    })
  ).toEqual([{ insertOne: { document: { name: 'x', organization_id: 'org_a' } } }]);
});

test('insertOne with authored tenant field throws', () => {
  expect(() =>
    applyTenantToBulkOperations({
      operations: [{ insertOne: { document: { organization_id: 'org_b' } } }],
      tenant,
    })
  ).toThrow('Tenant field "organization_id" can not be set in an insert document');
});

test('replaceOne filter is merged and replacement is stamped', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [
        { replaceOne: { filter: { _id: 1 }, replacement: { name: 'y' }, upsert: true } },
      ],
      tenant,
    })
  ).toEqual([
    {
      replaceOne: {
        filter: { $and: [{ _id: 1 }, { organization_id: 'org_a' }] },
        replacement: { name: 'y', organization_id: 'org_a' },
        upsert: true,
      },
    },
  ]);
});

test('replaceOne with authored tenant field in the replacement throws', () => {
  expect(() =>
    applyTenantToBulkOperations({
      operations: [
        { replaceOne: { filter: { _id: 1 }, replacement: { organization_id: 'org_b' } } },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organization_id" can not be set in a replacement document');
});

test('updateOne filter is merged and update is guarded', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ updateOne: { filter: { _id: 1 }, update: { $set: { v: 2 } } } }],
      tenant,
    })
  ).toEqual([
    {
      updateOne: {
        filter: { $and: [{ _id: 1 }, { organization_id: 'org_a' }] },
        update: { $set: { v: 2 } },
      },
    },
  ]);
});

test('updateOne with upsert adds $setOnInsert', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ updateOne: { filter: { _id: 1 }, update: { $set: { v: 2 } }, upsert: true } }],
      tenant,
    })
  ).toEqual([
    {
      updateOne: {
        filter: { $and: [{ _id: 1 }, { organization_id: 'org_a' }] },
        update: { $set: { v: 2 }, $setOnInsert: { organization_id: 'org_a' } },
        upsert: true,
      },
    },
  ]);
});

test('updateOne with authored tenant field in the update throws', () => {
  expect(() =>
    applyTenantToBulkOperations({
      operations: [
        { updateOne: { filter: { _id: 1 }, update: { $set: { organization_id: 'org_b' } } } },
      ],
      tenant,
    })
  ).toThrow('Tenant field "organization_id" can not be set in an update');
});

test('updateMany filter is merged and update is guarded', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ updateMany: { filter: {}, update: { $set: { v: 2 } } } }],
      tenant,
    })
  ).toEqual([
    {
      updateMany: {
        filter: { organization_id: 'org_a' },
        update: { $set: { v: 2 } },
      },
    },
  ]);
});

test('deleteOne filter is merged', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ deleteOne: { filter: { _id: 1 } } }],
      tenant,
    })
  ).toEqual([{ deleteOne: { filter: { $and: [{ _id: 1 }, { organization_id: 'org_a' }] } } }]);
});

test('deleteMany filter is merged', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ deleteMany: { filter: {} } }],
      tenant,
    })
  ).toEqual([{ deleteMany: { filter: { organization_id: 'org_a' } } }]);
});

test('deleteOne with authored tenant field in the filter throws', () => {
  expect(() =>
    applyTenantToBulkOperations({
      operations: [{ deleteOne: { filter: { organization_id: 'org_b' } } }],
      tenant,
    })
  ).toThrow('Tenant field "organization_id" can not be set in a filter');
});

test('a mixed batch is handled per operation kind', () => {
  expect(
    applyTenantToBulkOperations({
      operations: [{ insertOne: { document: { a: 1 } } }, { deleteMany: { filter: { a: 1 } } }],
      tenant,
    })
  ).toEqual([
    { insertOne: { document: { a: 1, organization_id: 'org_a' } } },
    { deleteMany: { filter: { $and: [{ a: 1 }, { organization_id: 'org_a' }] } } },
  ]);
});

test('unknown operation kind throws', () => {
  expect(() =>
    applyTenantToBulkOperations({
      operations: [{ renameCollection: { to: 'other' } }],
      tenant,
    })
  ).toThrow('Unsupported bulkWrite operation "renameCollection" on a tenant connection.');
});

test('empty operation object throws', () => {
  expect(() => applyTenantToBulkOperations({ operations: [{}], tenant })).toThrow(
    'Unsupported bulkWrite operation "undefined" on a tenant connection.'
  );
});

test('uses the custom tenant field name', () => {
  const customTenant = { field: 'tenantId', value: 't_1' };
  expect(
    applyTenantToBulkOperations({
      operations: [{ insertOne: { document: { a: 1 } } }],
      tenant: customTenant,
    })
  ).toEqual([{ insertOne: { document: { a: 1, tenantId: 't_1' } } }]);
});

test('trace names the operation each rewrite happened in', () => {
  const trace = { rewritten: [] };
  applyTenantToBulkOperations({
    operations: [
      { insertOne: { document: { a: 1 } } },
      { updateOne: { filter: { a: 1 }, update: { $set: { b: 2 } }, upsert: true } },
      { deleteMany: { filter: {} } },
    ],
    tenant,
    trace,
  });
  expect(trace.rewritten).toEqual([
    { at: 'operations[0].insertOne.document', injected: { organization_id: 'org_a' } },
    { at: 'operations[1].updateOne.filter', injected: { organization_id: 'org_a' } },
    { at: 'operations[1].updateOne.update.$setOnInsert', injected: { organization_id: 'org_a' } },
    { at: 'operations[2].deleteMany.filter', injected: { organization_id: 'org_a' } },
  ]);
});
