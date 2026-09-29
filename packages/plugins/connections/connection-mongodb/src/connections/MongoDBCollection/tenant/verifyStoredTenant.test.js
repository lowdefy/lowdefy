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

import { TenantIntegrityError } from '@lowdefy/errors';

import verifyStoredTenant, { idsOfMap } from './verifyStoredTenant.js';
import getTestCollection from '../../../../test/getTestCollection.js';
import populateTestMongoDb from '../../../../test/populateTestMongoDb.js';

const tenant = { field: 'organization_id', value: 'org_a' };

async function verify(collectionName, args) {
  const { collection, client } = await getTestCollection({ collection: collectionName });
  try {
    return await verifyStoredTenant({
      collection,
      connectionId: 'conn',
      endpointId: 'save',
      requestId: 'req',
      requestType: 'MongoDBInsertOne',
      ...args,
    });
  } finally {
    await client.close();
  }
}

async function readIds(collectionName) {
  const { collection, client } = await getTestCollection({ collection: collectionName });
  const docs = await collection.find({}, { sort: { _id: 1 } }).toArray();
  await client.close();
  return docs.map((doc) => doc._id);
}

test('idsOfMap flattens the driver index-to-id map', () => {
  expect(idsOfMap({ 0: 'a', 2: 'b' })).toEqual(['a', 'b']);
  expect(idsOfMap(undefined)).toEqual([]);
});

test('happy path: correctly stamped rows are left alone and nothing throws', async () => {
  const collection = 'verifyStoredHappy';
  await populateTestMongoDb({
    collection,
    documents: [
      { _id: 'a1', organization_id: 'org_a' },
      { _id: 'b1', organization_id: 'org_b' },
    ],
  });
  await verify(collection, { ids: ['a1'], tenant });
  expect(await readIds(collection)).toEqual(['a1', 'b1']);
});

test('is a no-op without a tenant or guard, and without ids', async () => {
  const collection = 'verifyStoredNoop';
  await populateTestMongoDb({ collection, documents: [{ _id: 'x1' }] });
  await verify(collection, { ids: ['x1'], tenant: null, tenantGuard: null });
  await verify(collection, { ids: [undefined, null], tenant });
  expect(await readIds(collection)).toEqual(['x1']);
});

test.each([
  ['missing', { _id: 'x1' }],
  ['null', { _id: 'x1', organization_id: null }],
  ['empty', { _id: 'x1', organization_id: '' }],
  ['wrong org', { _id: 'x1', organization_id: 'org_b' }],
])('a %s tenant field is deleted and throws TenantIntegrityError (scoped)', async (_, doc) => {
  const collection = 'verifyStoredScoped';
  await populateTestMongoDb({
    collection,
    documents: [doc, { _id: 'keep', organization_id: 'org_a' }],
  });
  const error = await verify(collection, { ids: ['x1', 'keep'], tenant }).catch((e) => e);
  expect(error).toBeInstanceOf(TenantIntegrityError);
  expect(error.collection).toBe(collection);
  expect(error.connectionId).toBe('conn');
  expect(error.endpointId).toBe('save');
  expect(error.field).toBe('organization_id');
  expect(error.organizationId).toBe('org_a');
  expect(error.message).toContain('request "req"');
  expect(await readIds(collection)).toEqual(['keep']);
});

test('under a tenantGuard a non-empty string is enough, but missing or empty is refused', async () => {
  const collection = 'verifyStoredGuard';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'ok', organization_id: 'org_z' }, { _id: 'bad' }],
  });
  const tenantGuard = { field: 'organization_id' };
  await verify(collection, { ids: ['ok'], tenant: null, tenantGuard });
  const error = await verify(collection, { ids: ['ok', 'bad'], tenant: null, tenantGuard }).catch(
    (e) => e
  );
  expect(error).toBeInstanceOf(TenantIntegrityError);
  expect(error.organizationId).toBeNull();
  expect(await readIds(collection)).toEqual(['ok']);
});

test('reads the row by _id without the tenant filter and never touches other rows', async () => {
  const collection = 'verifyStoredByIdOnly';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'org-less-old' }, { _id: 'new', organization_id: 'org_a' }],
  });
  await verify(collection, { ids: ['new'], tenant });
  expect(await readIds(collection)).toEqual(['new', 'org-less-old']);
});

test('a custom (dotted) tenant field is read as stored', async () => {
  const collection = 'verifyStoredDotted';
  await populateTestMongoDb({
    collection,
    documents: [{ _id: 'x1', meta: { org: 'org_b' } }],
  });
  const error = await verify(collection, {
    ids: ['x1'],
    tenant: { field: 'meta.org', value: 'org_a' },
  }).catch((e) => e);
  expect(error).toBeInstanceOf(TenantIntegrityError);
  expect(await readIds(collection)).toEqual([]);
});
