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

import { jest } from '@jest/globals';

import createAfterCreateOrganizationHook from './createAfterCreateOrganizationHook.js';

function createMockAuth() {
  const update = jest.fn(async () => ({}));
  const auth = { $context: Promise.resolve({ adapter: { update } }) };
  return { auth, update };
}

test('afterCreateOrganizationHook writes creatorAppRoles onto the creator member row', async () => {
  const { auth, update } = createMockAuth();
  const hook = createAfterCreateOrganizationHook({
    creatorAppRoles: ['owner', 'billing'],
    getAuth: () => auth,
  });
  const member = { id: 'member_1', userId: 'user_1', organizationId: 'org_1', role: 'owner' };

  await hook({ organization: { id: 'org_1' }, member, user: { id: 'user_1' } });

  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { appRoles: ['owner', 'billing'] },
  });
  // The endpoint returns this object, so the step result shows the roles.
  expect(member.appRoles).toEqual(['owner', 'billing']);
});

test('afterCreateOrganizationHook writes an empty appRoles array when creatorAppRoles is empty', async () => {
  const { auth, update } = createMockAuth();
  const hook = createAfterCreateOrganizationHook({ creatorAppRoles: [], getAuth: () => auth });

  await hook({ organization: { id: 'org_1' }, member: { id: 'member_1' }, user: { id: 'user_1' } });

  expect(update).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'id', value: 'member_1' }],
    update: { appRoles: [] },
  });
});

test('afterCreateOrganizationHook writes nothing for a creator-less organization', async () => {
  const { auth, update } = createMockAuth();
  const hook = createAfterCreateOrganizationHook({
    creatorAppRoles: ['owner'],
    getAuth: () => auth,
  });

  await hook({ organization: { id: 'org_1' }, member: null, user: null });

  expect(update).not.toHaveBeenCalled();
});
