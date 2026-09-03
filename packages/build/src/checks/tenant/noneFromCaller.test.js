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

test("noneFromCaller does not fire on a page request reading _state, which is never the caller's", () => {
  const context = createTenantContext();
  const components = pageRequest({
    connectionId: 'tenants_db',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { tenant_id: { $in: [{ '_state.selected': 'org' }] } } },
  });
  noneFromCaller.run({ components, context });
  expect(context.errors).toEqual([]);
});

// A routine step reads server-authored state, so _state is only a leak when a
// :set_state step wrote the key from the payload.
function taintedRoutine(setState) {
  const components = endpointStep({
    id: 'read_controls',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { organization_id: { _state: 'org_id' } } },
  });
  components.api[0].endpointId = 'sync';
  components.api[0].routine.unshift({ ':set_state': setState, '~k': 'k_set_state' });
  return components;
}

test('noneFromCaller errors when a step reads a state key a :set_state step wrote from _payload', () => {
  const context = createTenantContext();
  const components = taintedRoutine({ org_id: { _payload: 'organization_id' } });
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Step "read_controls" at endpoint "sync" declares "tenant: none" and takes "organization_id" from state key "org_id", which a ":set_state" step in this endpoint writes from the payload. The caller controls the payload, so any caller could read another organization\'s rows. Derive it from a previous step (_step), the caller (_user), or scope the step with runAs.'
  );
  expect(context.errors[0]).toMatchObject({
    configKey: 'k_read_controls',
    checkSlug: 'tenant-caller-source',
  });
});

test('noneFromCaller errors when the tainting :set_state write is nested in a control and dotted', () => {
  const context = createTenantContext();
  const components = taintedRoutine({ other: 'x' });
  components.api[0].routine.unshift({
    ':if': true,
    ':then': [
      { ':set_state': { 'org_id.selected': { _if: { test: true, then: { _payload: 'o' } } } } },
    ],
  });
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('noneFromCaller errors when a :set_state write is a _js body, whose source is unknowable', () => {
  const context = createTenantContext();
  const components = taintedRoutine({ org_id: { _js: 'x => x' } });
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
});

test('noneFromCaller does not fire when the state key is written from _user, _step, _secret or a literal', () => {
  const context = createTenantContext();
  [
    { org_id: { _user: 'organization_id' } },
    { org_id: { _step: 'lookup.organization_id' } },
    { org_id: { _secret: 'ORG_ID' } },
    { org_id: 'acme' },
  ].forEach((setState) => {
    const components = taintedRoutine(setState);
    noneFromCaller.run({ components, context });
  });
  expect(context.errors).toEqual([]);
});

test('noneFromCaller errors when the state path itself is computed, so what wrote it is unknowable', () => {
  const context = createTenantContext();
  const components = endpointStep({
    id: 'read_controls',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { organization_id: { _state: { key: { _payload: 'k' } } } } },
  });
  components.api[0].endpointId = 'sync';
  noneFromCaller.run({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(/takes "organization_id" from a computed state path/);
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
