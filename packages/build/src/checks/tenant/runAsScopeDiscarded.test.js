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
import runAsScopeDiscarded from './runAsScopeDiscarded.js';
import { createTenantContext, endpointStep } from './testSites.js';

function endpointWithRunAs({ tenant, connectionId, runAs = { organizationId: 'acme' } }) {
  const components = endpointStep({
    id: 'read_all_controls',
    connectionId,
    type: 'MongoDBFind',
    tenant,
    properties: { query: {} },
  });
  components.api[0].runAs = runAs;
  return components;
}

test('runAsScopeDiscarded runs on every build', () => {
  expect(runAsScopeDiscarded.slug).toBe('tenant-unscoped');
  expect(runAsScopeDiscarded.checkOnly).toBe(false);
});

test('runAsScopeDiscarded warns when a step under an endpoint runAs declares tenant: none', () => {
  const context = createTenantContext();
  runAsScopeDiscarded.run({ components: endpointWithRunAs({ tenant: 'none' }), context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toBe(
    'Step "read_all_controls" at endpoint "nightly_sync" declares "tenant: none" under an endpoint "runAs". The step opts out of the wall before the endpoint\'s organization is read, so that scope is discarded and the step runs across every organization. Remove "tenant: none" to keep the endpoint\'s scope.'
  );
  expect(context.warnings[0]).toMatchObject({
    configKey: 'k_read_all_controls',
    checkSlug: 'tenant-unscoped',
  });
});

test('runAsScopeDiscarded does not warn without an endpoint runAs', () => {
  const context = createTenantContext();
  runAsScopeDiscarded.run({
    components: endpointWithRunAs({ tenant: 'none', runAs: null }),
    context,
  });
  expect(context.warnings).toEqual([]);
});

test('runAsScopeDiscarded does not warn for a walled step that keeps the wall on', () => {
  const context = createTenantContext();
  runAsScopeDiscarded.run({ components: endpointWithRunAs({ tenant: undefined }), context });
  expect(context.warnings).toEqual([]);
});

test('runAsScopeDiscarded does not warn for a step on a connection outside the wall', () => {
  const context = createTenantContext();
  runAsScopeDiscarded.run({
    components: endpointWithRunAs({ tenant: 'none', connectionId: 'catalogue_db' }),
    context,
  });
  expect(context.warnings).toEqual([]);
});
