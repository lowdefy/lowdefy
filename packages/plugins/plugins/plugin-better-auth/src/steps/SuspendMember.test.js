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
import { vi, expect, test } from 'vitest';

import SuspendMember from './SuspendMember.js';
import createMockAuth from '../../test/createMockAuth.js';

// The step floor resolves the target organization and passes the id in; the
// defaulting and tenant-policy rules are tested there, not here.
const organizationId = 'org-1';
const acting = { user: { id: 'admin-user' } };

// rows is the organization's member table; update applies to the matching row.
function createAdapter(rows) {
  const matches = (row, where) =>
    where.every(({ field, value, operator }) =>
      operator === 'contains' ? row[field].includes(value) : row[field] === value
    );
  return {
    findOne: vi.fn(async ({ where }) => rows.find((row) => matches(row, where)) ?? null),
    findMany: vi.fn(async ({ where }) => rows.filter((row) => matches(row, where))),
    update: vi.fn(async ({ where, update }) => {
      const row = rows.find((candidate) => matches(candidate, where));
      return row ? { ...row, ...update } : null;
    }),
  };
}

test('SuspendMember marks the member row suspended, scoped to the resolved organization', async () => {
  const adapter = createAdapter([
    { id: 'member-1', organizationId, role: 'member', appRoles: ['viewer'] },
  ]);
  const { auth } = createMockAuth({ adapter });
  const result = await SuspendMember({
    acting,
    auth,
    organizationId,
    properties: { memberId: 'member-1' },
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'id', value: 'member-1' },
      { field: 'organizationId', value: 'org-1' },
      { field: 'role', value: 'member' },
    ],
    update: { suspended: true },
  });
  // The row keeps its roles - reports read them.
  expect(result).toEqual({
    id: 'member-1',
    organizationId,
    role: 'member',
    appRoles: ['viewer'],
    suspended: true,
  });
});

test('SuspendMember throws when memberId is missing', async () => {
  const { auth } = createMockAuth({ adapter: createAdapter([]) });
  await expect(SuspendMember({ acting, auth, organizationId, properties: {} })).rejects.toThrow(
    'SuspendMember requires a "memberId" property.'
  );
});

test('SuspendMember throws when the member is not in the resolved organization', async () => {
  const adapter = createAdapter([{ id: 'member-1', organizationId: 'org-2', role: 'member' }]);
  const { auth } = createMockAuth({ adapter });
  await expect(
    SuspendMember({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow('SuspendMember found no member "member-1" in organization "org-1".');
  expect(adapter.update).not.toHaveBeenCalled();
});

test('SuspendMember refuses to suspend an owner, even while another owner remains', async () => {
  const adapter = createAdapter([
    { id: 'member-1', organizationId, role: 'owner' },
    { id: 'member-2', organizationId, role: 'owner' },
  ]);
  const { auth } = createMockAuth({ adapter });
  await expect(
    SuspendMember({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow(
    'SuspendMember cannot suspend member "member-1" - they are an owner of organization "org-1". Change their org role with UpdateMemberOrgRole first.'
  );
  expect(adapter.update).not.toHaveBeenCalled();
});

test('SuspendMember refuses a member holding owner among several org roles', async () => {
  const adapter = createAdapter([{ id: 'member-1', organizationId, role: 'admin, owner' }]);
  const { auth } = createMockAuth({ adapter });
  await expect(
    SuspendMember({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow('they are an owner of organization "org-1"');
  expect(adapter.update).not.toHaveBeenCalled();
});

test('SuspendMember throws when the member row is removed or promoted between its read and its write', async () => {
  const adapter = createAdapter([{ id: 'member-1', organizationId, role: 'member' }]);
  adapter.update.mockResolvedValueOnce(null);
  const { auth } = createMockAuth({ adapter });
  await expect(
    SuspendMember({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow(
    'SuspendMember found no member "member-1" in organization "org-1" with role "member".'
  );
});

test("SuspendMember refuses to suspend the caller's own membership", async () => {
  const adapter = createAdapter([
    { id: 'member-1', organizationId, role: 'admin', userId: 'admin-user' },
  ]);
  const { auth } = createMockAuth({ adapter });
  await expect(
    SuspendMember({ acting, auth, organizationId, properties: { memberId: 'member-1' } })
  ).rejects.toThrow("it is the caller's own membership");
  expect(adapter.update).not.toHaveBeenCalled();
});

test('SuspendMember run as the system suspends any non-owner member', async () => {
  const adapter = createAdapter([
    { id: 'member-1', organizationId, role: 'admin', userId: 'admin-user' },
  ]);
  const { auth } = createMockAuth({ adapter });
  const result = await SuspendMember({
    acting: { system: true },
    auth,
    organizationId,
    properties: { memberId: 'member-1' },
  });
  expect(result).toMatchObject({ suspended: true });
});
