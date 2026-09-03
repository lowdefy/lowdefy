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
import collectWalledSites from './collectWalledSites.js';
import { createTenantContext, pageRequest, endpointStep, mergeComponents } from './testSites.js';

test('collectWalledSites returns nothing when no connection is walled', () => {
  const context = createTenantContext();
  context.tenantConnections = new Map();
  const components = pageRequest({ type: 'MongoDBFind', properties: {} });
  expect(collectWalledSites({ components, context })).toEqual([]);
});

test('collectWalledSites names a page request with its connection field and configKey', () => {
  const context = createTenantContext();
  const components = pageRequest({
    id: 'get_controls',
    type: 'MongoDBFind',
    tenant: 'none',
    properties: { query: { status: 'active' } },
  });
  expect(collectWalledSites({ components, context })).toEqual([
    {
      location: 'Request "get_controls" at page "controls"',
      kind: 'page',
      connectionId: 'controls_db',
      connectionType: 'MongoDBCollection',
      field: 'organization_id',
      requestType: 'MongoDBFind',
      tenant: 'none',
      properties: { query: { status: 'active' } },
      configKey: 'k_get_controls',
    },
  ]);
});

test('collectWalledSites finds a step nested inside routine controls and reads the custom field', () => {
  const context = createTenantContext();
  const components = endpointStep({
    id: 'insert_control',
    connectionId: 'tenants_db',
    type: 'MongoDBInsertOne',
    properties: { doc: { name: 'x' } },
  });
  components.api[0].endpointId = 'create_control';
  const sites = collectWalledSites({ components, context });
  expect(sites).toHaveLength(1);
  expect(sites[0]).toMatchObject({
    location: 'Step "insert_control" at endpoint "create_control"',
    kind: 'step',
    connectionId: 'tenants_db',
    field: 'tenant_id',
    requestType: 'MongoDBInsertOne',
    tenant: undefined,
    configKey: 'k_insert_control',
  });
});

test('collectWalledSites skips requests and steps on connections that are not walled', () => {
  const context = createTenantContext();
  const components = mergeComponents(
    pageRequest({ connectionId: 'catalogue_db', type: 'MongoDBFind', properties: {} }),
    endpointStep({ connectionId: 'smtp', type: 'SendGridMailSend', properties: {} })
  );
  expect(collectWalledSites({ components, context })).toEqual([]);
});

test('collectWalledSites defaults missing properties to an empty object', () => {
  const context = createTenantContext();
  const components = pageRequest({ type: 'MongoDBFind' });
  expect(collectWalledSites({ components, context })[0].properties).toEqual({});
});

test('collectWalledSites walks into a control that carries a stepId of its own', () => {
  const context = createTenantContext();
  const components = endpointStep({
    id: 'read_controls',
    type: 'MongoDBFind',
    properties: {},
  });
  // A control with a stepId used to end the walk, hiding every walled step
  // nested under it.
  components.api[0].routine = [
    { stepId: 'loop', ':while': true, ':do': components.api[0].routine },
  ];
  const sites = collectWalledSites({ components, context });
  expect(sites).toHaveLength(1);
  expect(sites[0].location).toBe('Step "read_controls" at endpoint "nightly_sync"');
});

test('collectWalledSites carries the endpoint routine on a step site so state writes can be read', () => {
  const context = createTenantContext();
  const components = endpointStep({ type: 'MongoDBFind', properties: {} });
  expect(collectWalledSites({ components, context })[0].routine).toBe(components.api[0].routine);
});
