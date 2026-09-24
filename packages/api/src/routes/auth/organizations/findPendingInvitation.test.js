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

import findPendingInvitation from './findPendingInvitation.js';

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const past = new Date(Date.now() - 3600 * 1000).toISOString();

test('findPendingInvitation queries by lowercased email and pending status', async () => {
  const findMany = jest.fn(async () => []);
  await findPendingInvitation({ adapter: { findMany }, email: 'User@Example.COM' });
  expect(findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'user@example.com' },
      { field: 'status', value: 'pending' },
    ],
  });
});

test('findPendingInvitation narrows to one organization when organizationId is given', async () => {
  const findMany = jest.fn(async () => []);
  await findPendingInvitation({
    adapter: { findMany },
    email: 'a@b.c',
    organizationId: 'org_1',
  });
  expect(findMany).toHaveBeenCalledWith({
    model: 'invitation',
    where: [
      { field: 'email', value: 'a@b.c' },
      { field: 'status', value: 'pending' },
      { field: 'organizationId', value: 'org_1' },
    ],
  });
});

test('findPendingInvitation returns the first unexpired invitation', async () => {
  const findMany = jest.fn(async () => [
    { id: 'inv_expired', expiresAt: past },
    { id: 'inv_live', expiresAt: future },
  ]);
  const invitation = await findPendingInvitation({ adapter: { findMany }, email: 'a@b.c' });
  expect(invitation.id).toBe('inv_live');
});

test('findPendingInvitation returns null when every invitation is expired', async () => {
  const findMany = jest.fn(async () => [{ id: 'inv_expired', expiresAt: past }]);
  const invitation = await findPendingInvitation({ adapter: { findMany }, email: 'a@b.c' });
  expect(invitation).toBe(null);
});
