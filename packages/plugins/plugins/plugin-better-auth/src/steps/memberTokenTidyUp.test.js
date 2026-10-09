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

import DeleteUser from './DeleteUser.js';
import RemoveMember from './RemoveMember.js';
import RevokeMcpGrant from './RevokeMcpGrant.js';
import createMockAuth from '../../test/createMockAuth.js';

// Member tokens beside the steps that end a membership or a grant: the MCP
// route's memberId check is what ends a token, these writes keep lists tidy.

function withTokenModel(auth) {
  auth.options.plugins.push({ id: 'lowdefy-mcp-token' });
  return auth;
}

test('RemoveMember deletes the removed member tokens', async () => {
  const removeMember = jest
    .fn()
    .mockResolvedValue({ member: { id: 'member_1', userId: 'user_9' } });
  const deleteMany = jest.fn(async () => 2);
  const { auth } = createMockAuth({
    adapter: { deleteMany },
    organizationEndpoints: { removeMember },
  });
  withTokenModel(auth);
  await RemoveMember({
    acting: { system: true, user: null },
    auth,
    organizationId: 'org_1',
    properties: { memberIdOrEmail: 'member_1' },
  });
  expect(deleteMany).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'memberId', value: 'member_1' }],
  });
});

test('RemoveMember touches no token model in an app without one', async () => {
  const removeMember = jest.fn().mockResolvedValue({ member: { id: 'member_1' } });
  const deleteMany = jest.fn();
  const { auth } = createMockAuth({
    adapter: { deleteMany },
    organizationEndpoints: { removeMember },
  });
  await RemoveMember({
    acting: { system: true, user: null },
    auth,
    organizationId: 'org_1',
    properties: { memberIdOrEmail: 'member_1' },
  });
  expect(deleteMany).not.toHaveBeenCalled();
});

test('DeleteUser deletes the user tokens in every organization', async () => {
  const removeUser = jest.fn().mockResolvedValue({ success: true });
  const adapter = {
    findOne: jest.fn(async () => ({ id: 'user_9', email: 'user9@example.com' })),
    findMany: jest.fn(async () => []),
    delete: jest.fn(),
    deleteMany: jest.fn(async () => 1),
  };
  const { auth } = createMockAuth({ adapter, adminEndpoints: { removeUser } });
  withTokenModel(auth);
  await DeleteUser({
    acting: { system: true, user: null },
    auth,
    properties: { userId: 'user_9' },
  });
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'userId', value: 'user_9' }],
  });
});

test('RevokeMcpGrant refuses a member token caller - there is no grant to revoke', async () => {
  const deleteMany = jest.fn();
  const auth = { $context: Promise.resolve({ adapter: { deleteMany } }) };
  await expect(
    RevokeMcpGrant({
      acting: { system: false, user: { id: 'user_1' } },
      auth,
      mcp: {
        tokenStatus: 'valid',
        tokenId: 'token_1',
        organizationId: 'org_1',
        grantedScopes: ['mcp:read', 'mcp:write'],
      },
      properties: {},
    })
  ).rejects.toThrow('a member token has no OAuth grant to revoke');
  expect(deleteMany).not.toHaveBeenCalled();
});
