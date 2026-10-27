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

import UnsuspendMember from './UnsuspendMember.js';
import createMockAuth from '../../test/createMockAuth.js';

const organizationId = 'org-1';

test('UnsuspendMember writes suspended false, scoped to the resolved organization', async () => {
  const updated = { id: 'member-1', appRoles: ['viewer'], suspended: false };
  const adapter = { update: vi.fn().mockResolvedValue(updated) };
  const { auth } = createMockAuth({ adapter });
  const result = await UnsuspendMember({
    auth,
    organizationId,
    properties: { memberId: 'member-1' },
  });
  expect(result).toEqual(updated);
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'id', value: 'member-1' },
      { field: 'organizationId', value: 'org-1' },
    ],
    update: { suspended: false },
  });
});

test('UnsuspendMember throws when memberId is missing', async () => {
  const { auth } = createMockAuth({ adapter: { update: vi.fn() } });
  await expect(UnsuspendMember({ auth, organizationId, properties: {} })).rejects.toThrow(
    'UnsuspendMember requires a "memberId" property.'
  );
});

test('UnsuspendMember throws when the member is not in the resolved organization', async () => {
  const adapter = { update: vi.fn().mockResolvedValue(null) };
  const { auth } = createMockAuth({ adapter });
  await expect(
    UnsuspendMember({ auth, organizationId, properties: { memberId: 'member-9' } })
  ).rejects.toThrow('UnsuspendMember found no member "member-9" in organization "org-1".');
});
