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

import RevokeOrgMcpToken from './RevokeOrgMcpToken.js';

const acting = { system: false, user: { id: 'admin_1', organization_id: 'org_1' } };

const row = {
  id: 'token_1',
  organizationId: 'org_1',
  userId: 'user_2',
  memberId: 'member_2',
  name: 'nightly worker',
  hash: 'hash_1',
  start: 'ldf_mcp_abcd',
};

function createAuth({ found = row, tokenModel = true } = {}) {
  const adapter = {
    findOne: jest.fn(async () => found),
    delete: jest.fn(async () => {}),
  };
  const plugins = tokenModel ? [{ id: 'lowdefy-mcp-token' }] : [];
  return { auth: { $context: Promise.resolve({ adapter }), options: { plugins } }, adapter };
}

test('RevokeOrgMcpToken deletes a token in the authorized organization and returns whose it was', async () => {
  const { auth, adapter } = createAuth();
  const result = await RevokeOrgMcpToken({
    acting,
    auth,
    organizationId: 'org_1',
    properties: { id: 'token_1' },
  });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [
      { field: 'id', value: 'token_1' },
      { field: 'organizationId', value: 'org_1' },
    ],
  });
  expect(adapter.delete).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'id', value: 'token_1' }],
  });
  expect(result).toEqual({
    id: 'token_1',
    userId: 'user_2',
    memberId: 'member_2',
    name: 'nightly worker',
    start: 'ldf_mcp_abcd',
  });
});

test('RevokeOrgMcpToken cannot reach a token in another organization', async () => {
  const { auth, adapter } = createAuth({ found: null });
  await expect(
    RevokeOrgMcpToken({ acting, auth, organizationId: 'org_2', properties: { id: 'token_1' } })
  ).rejects.toThrow('RevokeOrgMcpToken found no token with id "token_1" in this organization.');
  expect(adapter.findOne.mock.calls[0][0].where).toContainEqual({
    field: 'organizationId',
    value: 'org_2',
  });
  expect(adapter.delete).not.toHaveBeenCalled();
});

test('RevokeOrgMcpToken requires a string id', async () => {
  const { auth } = createAuth();
  await expect(
    RevokeOrgMcpToken({ acting, auth, organizationId: 'org_1', properties: { id: 7 } })
  ).rejects.toThrow('RevokeOrgMcpToken requires a string "id" property. Received 7.');
});

test('RevokeOrgMcpToken declares member update authority in the organization', () => {
  expect(RevokeOrgMcpToken.meta).toEqual({
    authority: { scope: 'org', permissions: { member: ['update'] } },
  });
});
