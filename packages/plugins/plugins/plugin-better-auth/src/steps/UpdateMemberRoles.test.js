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

import UpdateMemberRoles from './UpdateMemberRoles.js';
import createMockAuth from '../../test/createMockAuth.js';

// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';

test('UpdateMemberRoles writes appRoles directly through the adapter, scoped to the resolved organization', async () => {
  const updated = { id: 'member-1', appRoles: ['branch-manager'] };
  const adapter = { findOne: jest.fn(), update: jest.fn().mockResolvedValue(updated) };
  const updateMemberRole = jest.fn();
  const { auth } = createMockAuth({ adapter, organizationEndpoints: { updateMemberRole } });
  const result = await UpdateMemberRoles({
    auth,
    organizationId,
    properties: { memberId: 'member-1', appRoles: ['branch-manager'] },
  });
  expect(result).toEqual(updated);
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'id', value: 'member-1' },
      { field: 'organizationId', value: 'org-1' },
    ],
    update: { appRoles: ['branch-manager'] },
  });
  expect(updateMemberRole).not.toHaveBeenCalled();
});

test('UpdateMemberRoles accepts an unrecognised role name without checking any catalog', async () => {
  const adapter = { update: jest.fn().mockResolvedValue({ id: 'member-1' }) };
  const { auth } = createMockAuth({ adapter });
  await UpdateMemberRoles({
    auth,
    organizationId,
    properties: { memberId: 'member-1', appRoles: ['no-such-role'] },
  });
  expect(adapter.update.mock.calls[0][0].update).toEqual({ appRoles: ['no-such-role'] });
});

test('UpdateMemberRoles clears the member app roles when appRoles is an empty array', async () => {
  const adapter = { update: jest.fn().mockResolvedValue({ id: 'member-1', appRoles: [] }) };
  const { auth } = createMockAuth({ adapter });
  const result = await UpdateMemberRoles({
    auth,
    organizationId,
    properties: { memberId: 'member-1', appRoles: [] },
  });
  expect(result).toEqual({ id: 'member-1', appRoles: [] });
  expect(adapter.update.mock.calls[0][0].update).toEqual({ appRoles: [] });
});

test('UpdateMemberRoles does not read the member row or write the user row', async () => {
  const adapter = {
    findOne: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn().mockResolvedValue({ id: 'member-1' }),
  };
  const { auth } = createMockAuth({ adapter });
  await UpdateMemberRoles({
    auth,
    organizationId,
    properties: { memberId: 'member-1', appRoles: ['branch-manager'] },
  });
  expect(adapter.findOne).not.toHaveBeenCalled();
  expect(adapter.findMany).not.toHaveBeenCalled();
  expect(adapter.update).toHaveBeenCalledTimes(1);
});

test('UpdateMemberRoles throws when no member matches the memberId within the resolved organization', async () => {
  const adapter = { update: jest.fn().mockResolvedValue(null) };
  const { auth } = createMockAuth({ adapter });
  await expect(
    UpdateMemberRoles({
      auth,
      organizationId,
      properties: { memberId: 'member-other-org', appRoles: ['branch-manager'] },
    })
  ).rejects.toThrow(
    'UpdateMemberRoles found no member "member-other-org" in organization "org-1".'
  );
});

test('UpdateMemberRoles throws when memberId property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({ auth, organizationId, properties: { appRoles: [] } })
  ).rejects.toThrow('UpdateMemberRoles requires a "memberId" property.');
});

test('UpdateMemberRoles throws when appRoles property is missing', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({ auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow('UpdateMemberRoles requires an "appRoles" array.');
});

test('UpdateMemberRoles throws when appRoles is a comma-separated string', async () => {
  const { auth } = createMockAuth();
  await expect(
    UpdateMemberRoles({
      auth,
      organizationId,
      properties: { memberId: 'member-1', appRoles: 'a,b' },
    })
  ).rejects.toThrow('UpdateMemberRoles requires an "appRoles" array.');
});
