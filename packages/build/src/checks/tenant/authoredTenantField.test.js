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
import authoredTenantField from './authoredTenantField.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

test('authoredTenantField is the tenant rule that also fails builds', () => {
  expect(authoredTenantField.slug).toBe('tenant-authored');
  expect(authoredTenantField.checkOnly).toBe(false);
});

test('authoredTenantField errors when a walled request filters by the tenant field', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { organization_id: { _user: 'organization_id' }, status: 'active' } },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Request "get_controls" at page "controls" sets "organization_id" itself on tenant connection "controls_db". The wall injects it — an authored value is refused at runtime. Remove the clause; the caller\'s organization is applied automatically.'
  );
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_get_controls',
    checkSlug: 'tenant-authored',
  });
});

test('authoredTenantField errors when a walled insert step writes the custom tenant field deep in a document', () => {
  const context = createTenantContext();
  const components = endpointStep({
    id: 'insert_control',
    connectionId: 'tenants_db',
    type: 'MongoDBInsertOne',
    properties: { doc: { name: 'x', meta: { tenant_id: 'abc' } } },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(
    /^Step "insert_control" at endpoint "nightly_sync" sets "tenant_id" itself on tenant connection "tenants_db"\./
  );
});

test('authoredTenantField does not fire for tenant: authored or tenant: none sites', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({
      type: 'MongoDBAggregation',
      tenant: 'authored',
      properties: {
        pipeline: [
          { $search: { compound: { filter: [{ equals: { path: 'organization_id' } }] } } },
          { $match: { organization_id: 'a' } },
        ],
      },
    }),
    endpointStep({
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { organization_id: 'a' } },
    })
  );
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField does not fire on a connection that is not walled', () => {
  const context = createTenantContext();
  const components = pageRequest({
    connectionId: 'catalogue_db',
    type: 'MongoDBFind',
    properties: { query: { organization_id: 'a' } },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField skips an operator-valued filter rather than guessing', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { '_object.assign': [{ status: 'active' }, { organization_id: 'a' }] } },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField does not fire when the filter never names the field', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: { query: { status: 'active' } },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField does not fire on a projection or sort that only reads the tenant field', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBFind',
    properties: {
      query: { status: 'active' },
      options: { projection: { organization_id: 0 }, sort: { organization_id: 1 } },
    },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField does not fire on a $group key or an index hint naming the tenant field', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBAggregation',
    properties: {
      pipeline: [{ $group: { _id: '$organization_id', n: { $sum: 1 } } }],
      options: { hint: { organization_id: 1 } },
    },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('authoredTenantField errors on a $match stage nested in a $lookup sub-pipeline', () => {
  const context = createTenantContext();
  const components = pageRequest({
    type: 'MongoDBAggregation',
    properties: {
      pipeline: [
        { $lookup: { from: 'other', as: 'o', pipeline: [{ $match: { organization_id: 'a' } }] } },
      ],
    },
  });
  authoredTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('authoredTenantField errors on an update that sets the tenant field, and on a bulk operation', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({
      id: 'update_control',
      type: 'MongoDBUpdateOne',
      properties: { filter: { _id: 'a' }, update: { $set: { organization_id: 'b' } } },
    }),
    endpointStep({
      id: 'bulk_controls',
      type: 'MongoDBBulkWrite',
      properties: {
        operations: [{ insertOne: { document: { organization_id: 'b' } } }],
      },
    })
  );
  authoredTenantField.run({ components, context });
  expect(context.errors).toHaveLength(2);
});
