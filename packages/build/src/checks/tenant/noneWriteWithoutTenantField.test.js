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
import noneWriteWithoutTenantField, {
  INSERT_REQUEST_TYPES,
  UPSERT_REQUEST_TYPES,
} from './noneWriteWithoutTenantField.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

const expected =
  'Step "write_control" at endpoint "sync" declares "tenant: none" and inserts a document without "organization_id". The row would belong to no organization and be invisible to every walled read. Add the field, or scope the step with runAs.';

function writeStep(step) {
  const components = endpointStep({ id: 'write_control', tenant: 'none', ...step });
  components.api[0].endpointId = 'sync';
  return components;
}

test('noneWriteWithoutTenantField runs under check only and exports the audited types', () => {
  expect(noneWriteWithoutTenantField.slug).toBe('tenant-unstamped-write');
  expect(noneWriteWithoutTenantField.checkOnly).toBe(true);
  expect(INSERT_REQUEST_TYPES).toEqual([
    'MongoDBInsertOne',
    'MongoDBInsertMany',
    'MongoDBInsertConsecutiveId',
    'MongoDBInsertManyConsecutiveIds',
  ]);
  expect(UPSERT_REQUEST_TYPES).toEqual([
    'MongoDBUpdateOne',
    'MongoDBUpdateMany',
    'MongoDBVersionedUpdateOne',
  ]);
});

test('noneWriteWithoutTenantField errors when a tenant: none insert has no tenant field on the doc', () => {
  const context = createTenantContext();
  const components = writeStep({ type: 'MongoDBInsertOne', properties: { doc: { name: 'x' } } });
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(expected);
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_write_control',
    checkSlug: 'tenant-unstamped-write',
  });
});

test('noneWriteWithoutTenantField errors when one of many inserted docs lacks the field', () => {
  const context = createTenantContext();
  const components = writeStep({
    type: 'MongoDBInsertMany',
    properties: { docs: [{ organization_id: 'a', name: 'x' }, { name: 'y' }] },
  });
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('noneWriteWithoutTenantField errors when the field sits below the top level of the doc', () => {
  const context = createTenantContext();
  const components = writeStep({
    type: 'MongoDBInsertOne',
    properties: { doc: { meta: { organization_id: 'a' } } },
  });
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('noneWriteWithoutTenantField errors for an upsert whose $set, $setOnInsert and filter all lack the field', () => {
  const context = createTenantContext();
  const components = writeStep({
    type: 'MongoDBUpdateOne',
    properties: {
      filter: { code: 'c1' },
      update: { $set: { name: 'x' }, $setOnInsert: { created: 1 } },
      options: { upsert: true },
    },
  });
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(expected);
});

test('noneWriteWithoutTenantField accepts an upsert that stamps the field through $setOnInsert or the filter', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    writeStep({
      type: 'MongoDBUpdateMany',
      properties: {
        filter: { code: 'c1' },
        update: { $setOnInsert: { organization_id: { _step: 'org._id' } } },
        options: { upsert: true },
      },
    }),
    pageRequest({
      type: 'MongoDBVersionedUpdateOne',
      tenant: 'none',
      properties: {
        filter: { organization_id: { _user: 'organization_id' } },
        update: { $set: { name: 'x' } },
        options: { upsert: true },
      },
    })
  );
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWriteWithoutTenantField does not fire for an update without upsert or a non-write type', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    writeStep({
      type: 'MongoDBUpdateOne',
      properties: { filter: { code: 'c1' }, update: { $set: { name: 'x' } } },
    }),
    pageRequest({
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { status: 'active' } },
    })
  );
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWriteWithoutTenantField does not fire when the doc carries the custom field at its top level', () => {
  const context = createTenantContext();
  const components = writeStep({
    connectionId: 'tenants_db',
    type: 'MongoDBInsertOne',
    properties: { doc: { tenant_id: { _step: 'org._id' }, name: 'x' } },
  });
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWriteWithoutTenantField does not fire for a walled insert without the sentinel or on a non-walled connection', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    endpointStep({ type: 'MongoDBInsertOne', properties: { doc: { name: 'x' } } }),
    pageRequest({
      connectionId: 'catalogue_db',
      type: 'MongoDBInsertOne',
      tenant: 'none',
      properties: { doc: { name: 'x' } },
    })
  );
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneWriteWithoutTenantField skips an operator-composed document or update', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    writeStep({ type: 'MongoDBInsertOne', properties: { doc: { _payload: 'doc' } } }),
    pageRequest({
      id: 'insert_many',
      type: 'MongoDBInsertMany',
      tenant: 'none',
      properties: { docs: [{ name: 'x' }, { _step: 'built_doc' }] },
    }),
    pageRequest({
      id: 'upsert',
      type: 'MongoDBUpdateOne',
      tenant: 'none',
      properties: {
        filter: { code: 'c1' },
        update: { _step: 'update' },
        options: { upsert: true },
      },
    })
  );
  noneWriteWithoutTenantField.run({ components, context });
  expect(context.errors).toEqual([]);
});
