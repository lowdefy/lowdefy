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
import noneFromCaller from './noneFromCaller.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

test('noneFromCaller runs under check only', () => {
  expect(noneFromCaller.slug).toBe('tenant-caller-source');
  expect(noneFromCaller.checkOnly).toBe(true);
});

test('noneFromCaller errors when a tenant: none step takes the field from _payload', () => {
  const context = createTenantContext();
  const components = endpointStep({
    id: 'read_controls',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { organization_id: { _payload: 'organization_id' } } },
  });
  components.api[0].endpointId = 'sync';
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Step "read_controls" at endpoint "sync" declares "tenant: none" and takes "organization_id" from "_payload". The caller controls the payload, so any caller could read another organization\'s rows. Derive it from a previous step (_step), the caller (_user), or scope the step with runAs.'
  );
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_read_controls',
    checkSlug: 'tenant-caller-source',
  });
});

test('noneFromCaller errors for the dotted _state shorthand nested inside the tenant value', () => {
  const context = createTenantContext();
  const components = pageRequest({
    connectionId: 'tenants_db',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { tenant_id: { $in: [{ '_state.selected': 'org' }] } } },
  });
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(
    /takes "tenant_id" from "_state"\. The caller controls the state,/
  );
});

test('noneFromCaller does not fire when the tenant value comes from _user or _step', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { organization_id: { _user: 'organization_id' } } },
    }),
    endpointStep({
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { organization_id: { _step: 'org._id' } } },
    })
  );
  noneFromCaller.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneFromCaller does not fire when the payload is used elsewhere than the tenant value', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    tenant: 'none',
    properties: {
      query: { organization_id: { _step: 'org._id' }, status: { _payload: 'status' } },
    },
  });
  noneFromCaller.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneFromCaller does not fire for a site without the tenant: none sentinel or on a non-walled connection', () => {
  const context = createTenantContext();
  const query = { organization_id: { _payload: 'organization_id' } };
  const components = mergeComponents(
    pageRequest({ type: 'MongoDBFind', tenant: 'authored', properties: { query } }),
    endpointStep({
      connectionId: 'catalogue_db',
      type: 'MongoDBFind',
      tenant: 'none',
      properties: { query },
    })
  );
  noneFromCaller.run({ components, context });
  expect(context.errors).toEqual([]);
});

test('noneFromCaller skips a filter composed by an operator', () => {
  const context = createTenantContext();
  const components = endpointStep({
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { '_object.assign': [{ organization_id: { _payload: 'org' } }] } },
  });
  noneFromCaller.run({ components, context });
  expect(context.errors).toEqual([]);
});
