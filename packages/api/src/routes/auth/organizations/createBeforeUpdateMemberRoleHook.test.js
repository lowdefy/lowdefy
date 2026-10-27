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

import { expect, test } from 'vitest';

import createBeforeUpdateMemberRoleHook from './createBeforeUpdateMemberRoleHook.js';

const user = { id: 'user_1' };
const organization = { id: 'org_1' };

test('beforeUpdateMemberRoleHook refuses making a suspended member an owner', async () => {
  const hook = createBeforeUpdateMemberRoleHook();
  await expect(
    hook({
      member: { id: 'member_1', role: 'member', suspended: true },
      newRole: 'owner',
      user,
      organization,
    })
  ).rejects.toMatchObject({
    statusCode: 400,
    body: { code: 'SUSPENDED_MEMBER_CANNOT_BE_OWNER' },
  });
});

test('beforeUpdateMemberRoleHook refuses owner among several roles for a suspended member', async () => {
  const hook = createBeforeUpdateMemberRoleHook();
  await expect(
    hook({
      member: { id: 'member_1', role: 'member', suspended: true },
      newRole: 'admin,owner',
      user,
      organization,
    })
  ).rejects.toMatchObject({ body: { code: 'SUSPENDED_MEMBER_CANNOT_BE_OWNER' } });
});

test('beforeUpdateMemberRoleHook lets a suspended member change to a role other than owner', async () => {
  const hook = createBeforeUpdateMemberRoleHook();
  await expect(
    hook({
      member: { id: 'member_1', role: 'member', suspended: true },
      newRole: 'admin',
      user,
      organization,
    })
  ).resolves.toBeUndefined();
});

test('beforeUpdateMemberRoleHook lets an unsuspended member be made an owner', async () => {
  const hook = createBeforeUpdateMemberRoleHook();
  await expect(
    hook({ member: { id: 'member_1', role: 'admin' }, newRole: 'owner', user, organization })
  ).resolves.toBeUndefined();
});
