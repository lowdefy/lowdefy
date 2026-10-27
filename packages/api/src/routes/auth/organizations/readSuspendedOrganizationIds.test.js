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

import readSuspendedOrganizationIds from './readSuspendedOrganizationIds.js';

test('readSuspendedOrganizationIds reads only the suspended rows of the person', async () => {
  const adapter = {
    findMany: vi.fn(async () => [
      { id: 'member_1', organizationId: 'org_1', suspended: true },
      { id: 'member_2', organizationId: 'org_2', suspended: true },
    ]),
  };
  const organizationIds = await readSuspendedOrganizationIds({ adapter, userId: 'user_1' });
  expect(organizationIds).toEqual(['org_1', 'org_2']);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'suspended', value: true },
    ],
    limit: 1000,
  });
});

test('readSuspendedOrganizationIds returns no organizations when the person is suspended nowhere', async () => {
  const adapter = { findMany: vi.fn(async () => []) };
  expect(await readSuspendedOrganizationIds({ adapter, userId: 'user_1' })).toEqual([]);
});
