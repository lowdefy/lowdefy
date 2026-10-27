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

import readMemberships from './readMemberships.js';

function mockAdapter({ rows, activeRow = null }) {
  return {
    findMany: vi.fn().mockResolvedValue(rows),
    findOne: vi.fn().mockResolvedValue(activeRow),
  };
}

function rowsFor(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `member_${index}`,
    organizationId: `org_${index}`,
  }));
}

test('readMemberships reads every member row of the user in one query', async () => {
  const adapter = mockAdapter({ rows: rowsFor(2) });

  await readMemberships({ adapter, organizationId: 'org_1', userId: 'user_1' });

  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'member',
    where: [{ field: 'userId', value: 'user_1' }],
    limit: 1000,
  });
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('readMemberships picks the row in the active organization and lists every organization', async () => {
  const adapter = mockAdapter({ rows: rowsFor(3) });

  const result = await readMemberships({ adapter, organizationId: 'org_1', userId: 'user_1' });

  expect(result).toEqual({
    member: { id: 'member_1', organizationId: 'org_1' },
    organizationIds: ['org_0', 'org_1', 'org_2'],
  });
});

test('readMemberships returns no member when the user holds no row in the active organization', async () => {
  const adapter = mockAdapter({ rows: rowsFor(2) });

  const result = await readMemberships({ adapter, organizationId: 'org_9', userId: 'user_1' });

  expect(result).toEqual({ member: null, organizationIds: ['org_0', 'org_1'] });
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('readMemberships returns a suspended active row and leaves suspended organizations out of the list', async () => {
  const adapter = mockAdapter({
    rows: [
      { id: 'member_0', organizationId: 'org_0' },
      { id: 'member_1', organizationId: 'org_1', suspended: true },
      { id: 'member_2', organizationId: 'org_2', suspended: false },
    ],
  });

  const result = await readMemberships({ adapter, organizationId: 'org_1', userId: 'user_1' });

  expect(result).toEqual({
    member: { id: 'member_1', organizationId: 'org_1', suspended: true },
    organizationIds: ['org_0', 'org_2'],
  });
});

test('readMemberships lists no organizations for a user with no member rows', async () => {
  const adapter = mockAdapter({ rows: [] });

  const result = await readMemberships({ adapter, organizationId: 'org_1', userId: 'user_1' });

  expect(result).toEqual({ member: null, organizationIds: [] });
});

test('readMemberships leaves the list out when the rows fill one read', async () => {
  const adapter = mockAdapter({ rows: rowsFor(1000) });

  const result = await readMemberships({ adapter, organizationId: 'org_5', userId: 'user_1' });

  expect(result).toEqual({
    member: { id: 'member_5', organizationId: 'org_5' },
    organizationIds: null,
  });
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('readMemberships reads the active row on its own when the rows fill one read without it', async () => {
  const activeRow = { id: 'member_x', organizationId: 'org_x' };
  const adapter = mockAdapter({ rows: rowsFor(1000), activeRow });

  const result = await readMemberships({ adapter, organizationId: 'org_x', userId: 'user_1' });

  expect(result).toEqual({ member: activeRow, organizationIds: null });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'member',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'organizationId', value: 'org_x' },
    ],
  });
});
