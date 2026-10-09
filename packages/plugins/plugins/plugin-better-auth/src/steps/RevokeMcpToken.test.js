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

import RevokeMcpToken from './RevokeMcpToken.js';

const acting = { system: false, user: { id: 'user_1', organization_id: 'org_1' } };

const row = {
  id: 'token_1',
  organizationId: 'org_1',
  userId: 'user_1',
  memberId: 'member_1',
  name: 'nightly worker',
  hash: 'hash_1',
  start: 'ldf_mcp_abcd',
};

function createAuth({ found = row, tokenModel = true } = {}) {
  const adapter = {
    findOne: jest.fn(async () => found),
    delete: jest.fn(async () => {}),
  };
  const plugins = tokenModel ? [{ id: 'lowdefy-mcp-token', schema: { mcpToken: {} } }] : [];
  return { auth: { $context: Promise.resolve({ adapter }), options: { plugins } }, adapter };
}

test('RevokeMcpToken deletes one of the caller own tokens and returns it without the hash', async () => {
  const { auth, adapter } = createAuth();
  const result = await RevokeMcpToken({ acting, auth, properties: { id: 'token_1' } });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [
      { field: 'id', value: 'token_1' },
      { field: 'userId', value: 'user_1' },
    ],
  });
  expect(adapter.delete).toHaveBeenCalledWith({
    model: 'mcpToken',
    where: [{ field: 'id', value: 'token_1' }],
  });
  expect(result).toEqual({
    id: 'token_1',
    userId: 'user_1',
    memberId: 'member_1',
    name: 'nightly worker',
    start: 'ldf_mcp_abcd',
  });
});

test('RevokeMcpToken on another member token or a missing one deletes nothing and says not found', async () => {
  const { auth, adapter } = createAuth({ found: null });
  await expect(RevokeMcpToken({ acting, auth, properties: { id: 'token_9' } })).rejects.toThrow(
    'RevokeMcpToken found no token with id "token_9".'
  );
  expect(adapter.delete).not.toHaveBeenCalled();
});

test('RevokeMcpToken requires a string id', async () => {
  const { auth } = createAuth();
  await expect(RevokeMcpToken({ acting, auth, properties: {} })).rejects.toThrow(
    'RevokeMcpToken requires a string "id" property.'
  );
});

test('RevokeMcpToken refuses in an app with no MCP authorization server', async () => {
  const { auth } = createAuth({ tokenModel: false });
  await expect(RevokeMcpToken({ acting, auth, properties: { id: 'token_1' } })).rejects.toThrow(
    'RevokeMcpToken needs the MCP authorization server'
  );
});
