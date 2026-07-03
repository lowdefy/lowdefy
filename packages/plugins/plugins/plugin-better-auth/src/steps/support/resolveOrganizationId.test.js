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

import resolveOrganizationId from './resolveOrganizationId.js';

const pinnedOrganization = {
  policy: 'pinned',
  pinned: { id: 'org_pinned', slug: 'org-a', name: 'org-a' },
};

const tenantOrganization = { policy: 'tenant', pinned: null };

test('resolveOrganizationId returns the explicit organizationId when provided', () => {
  expect(
    resolveOrganizationId({
      organization: pinnedOrganization,
      organizationId: 'org-explicit',
      step: 'TestStep',
    })
  ).toBe('org-explicit');
});

test('resolveOrganizationId returns the explicit organizationId even under the tenant policy', () => {
  expect(
    resolveOrganizationId({
      organization: tenantOrganization,
      organizationId: 'org-explicit',
      step: 'TestStep',
    })
  ).toBe('org-explicit');
});

test('resolveOrganizationId throws under the tenant policy when organizationId is omitted', () => {
  expect(() =>
    resolveOrganizationId({ organization: tenantOrganization, organizationId: undefined, step: 'TestStep' })
  ).toThrow(
    'TestStep requires an "organizationId" property under the "tenant" organizations policy - there is no pinned organization to default to. Set organizationId on the step properties.'
  );
});

test('resolveOrganizationId throws when the pinned organization is not resolved', () => {
  expect(() =>
    resolveOrganizationId({
      organization: { policy: 'pinned', pinned: null },
      organizationId: undefined,
      step: 'TestStep',
    })
  ).toThrow(
    'TestStep could not default "organizationId" - the pinned organization is not resolved. Set organizationId on the step properties, or check that auth organizations are configured and the database is reachable.'
  );
});

test('resolveOrganizationId throws when organization is undefined and organizationId is omitted', () => {
  expect(() =>
    resolveOrganizationId({ organization: undefined, organizationId: undefined, step: 'TestStep' })
  ).toThrow(
    'TestStep could not default "organizationId" - the pinned organization is not resolved. Set organizationId on the step properties, or check that auth organizations are configured and the database is reachable.'
  );
});

test('resolveOrganizationId returns the pinned organization id when organizationId is omitted', () => {
  expect(
    resolveOrganizationId({ organization: pinnedOrganization, organizationId: undefined, step: 'TestStep' })
  ).toBe('org_pinned');
});
