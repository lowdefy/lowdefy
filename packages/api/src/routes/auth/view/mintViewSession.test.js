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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import mintViewSession from './mintViewSession.js';
import signSessionToken from './signSessionToken.js';

const NOW = new Date('2026-11-12T10:00:00Z').getTime();

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createContext({ mcpAuth, user, stale = [], createdSession } = {}) {
  const adapter = {
    findMany: vi.fn().mockResolvedValue(stale),
    update: vi.fn().mockResolvedValue({}),
  };
  const internalAdapter = {
    createSession: vi.fn(async (userId, dontRememberMe, override) =>
      createdSession === undefined
        ? { id: 'sess_1', token: 'tok', userId, activeOrganizationId: 'org_oldest', ...override }
        : createdSession
    ),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  };
  const context = {
    auth: { $context: Promise.resolve({ adapter, internalAdapter, secret: 'secret' }) },
    logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    mcpAuth:
      mcpAuth === undefined
        ? {
            clientId: 'client_1',
            organizationId: 'org_1',
            tokenStatus: 'valid',
            parseableJwt: true,
            grantedScopes: ['mcp:read'],
          }
        : mcpAuth,
    user: user === undefined ? { id: 'user_1', auth_method: 'mcp' } : user,
  };
  return { adapter, context, internalAdapter };
}

test('mintViewSession creates a view session for the caller in the grant organization and returns its signed token', async () => {
  const { adapter, context, internalAdapter } = createContext();
  const result = await mintViewSession(context);
  const expiresAt = new Date(NOW + 15 * 60 * 1000);
  expect(internalAdapter.createSession).toHaveBeenCalledWith(
    'user_1',
    false,
    {
      expiresAt,
      token: expect.stringMatching(/^ldf_view_[A-Za-z0-9_-]{43}$/),
      view: true,
      viewClientId: 'client_1',
      viewScopes: 'mcp:read',
    },
    true
  );
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'id', value: 'sess_1' }],
    update: { activeOrganizationId: 'org_1' },
  });
  const { token } = internalAdapter.createSession.mock.calls[0][2];
  expect(result).toEqual({
    token: signSessionToken({ secret: 'secret', token }),
    expiresAt,
  });
});

test('mintViewSession gives each view session a token of its own', async () => {
  const { context, internalAdapter } = createContext();
  await mintViewSession(context);
  await mintViewSession(context);
  const [first, second] = internalAdapter.createSession.mock.calls.map((call) => call[2].token);
  expect(first).not.toBe(second);
});

test('mintViewSession records both scopes of a write grant', async () => {
  const { context, internalAdapter } = createContext({
    mcpAuth: {
      clientId: 'client_1',
      organizationId: 'org_1',
      tokenStatus: 'valid',
      grantedScopes: ['mcp:read', 'mcp:write'],
    },
  });
  await mintViewSession(context);
  expect(internalAdapter.createSession.mock.calls[0][2].viewScopes).toBe('mcp:read mcp:write');
});

test('mintViewSession writes one log line and nothing else', async () => {
  const { context } = createContext();
  await mintViewSession(context);
  expect(context.logger.info).toHaveBeenCalledTimes(1);
  expect(context.logger.info).toHaveBeenCalledWith(
    {
      event: 'mcp_view_session_minted',
      clientId: 'client_1',
      organizationId: 'org_1',
      pruned: 0,
      sessionId: 'sess_1',
      userId: 'user_1',
    },
    expect.any(String)
  );
  expect(JSON.stringify(context.logger.info.mock.calls)).not.toContain('tok');
});

test('mintViewSession deletes the grant sessions past the cap, oldest first', async () => {
  const { adapter, context, internalAdapter } = createContext({
    stale: [{ token: 'old_1' }, { token: 'old_2' }],
  });
  await mintViewSession(context);
  expect(adapter.findMany).toHaveBeenCalledWith({
    model: 'session',
    where: [
      { field: 'userId', value: 'user_1' },
      { field: 'view', value: true },
      { field: 'viewClientId', value: 'client_1' },
      { field: 'activeOrganizationId', value: 'org_1' },
    ],
    sortBy: { field: 'createdAt', direction: 'desc' },
    offset: 20,
  });
  expect(internalAdapter.deleteSession.mock.calls).toEqual([['old_1'], ['old_2']]);
  expect(context.logger.info.mock.calls[0][0].pruned).toBe(2);
});

test('mintViewSession refuses a member token', async () => {
  const { context, internalAdapter } = createContext({
    mcpAuth: {
      tokenStatus: 'valid',
      tokenId: 'token_1',
      organizationId: 'org_1',
      grantedScopes: ['mcp:read', 'mcp:write'],
    },
  });
  await expect(mintViewSession(context)).rejects.toMatchObject({ name: 'AuthorizationError' });
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('mintViewSession refuses a member token even when it names a client', async () => {
  const { context, internalAdapter } = createContext({
    mcpAuth: {
      tokenStatus: 'valid',
      tokenId: 'token_1',
      clientId: 'client_1',
      organizationId: 'org_1',
      grantedScopes: ['mcp:read'],
    },
  });
  await expect(mintViewSession(context)).rejects.toMatchObject({ name: 'AuthorizationError' });
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
});

test('mintViewSession refuses the anonymous caller', async () => {
  const { context, internalAdapter } = createContext({
    mcpAuth: { tokenStatus: 'none', parseableJwt: true },
    user: null,
  });
  await expect(mintViewSession(context)).rejects.toMatchObject({ name: 'AuthenticationError' });
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
});

test('mintViewSession refuses an invalid token, a valid token with no caller, and a context with no MCP outcome', async () => {
  const invalid = createContext({
    mcpAuth: { clientId: 'client_1', organizationId: 'org_1', tokenStatus: 'invalid' },
    user: null,
  });
  await expect(mintViewSession(invalid.context)).rejects.toMatchObject({
    name: 'AuthenticationError',
  });
  // A pinned app's token for another organization is valid and resolves no caller.
  const noCaller = createContext({ user: null });
  await expect(mintViewSession(noCaller.context)).rejects.toMatchObject({
    name: 'AuthenticationError',
  });
  const session = createContext({ mcpAuth: null });
  await expect(mintViewSession(session.context)).rejects.toMatchObject({
    name: 'AuthenticationError',
  });
  expect(invalid.internalAdapter.createSession).not.toHaveBeenCalled();
  expect(noCaller.internalAdapter.createSession).not.toHaveBeenCalled();
  expect(session.internalAdapter.createSession).not.toHaveBeenCalled();
});

test('mintViewSession leaves the organization alone when the policy hook already picked the grant organization', async () => {
  const { adapter, context } = createContext({
    createdSession: { id: 'sess_1', token: 'tok', activeOrganizationId: 'org_1' },
  });
  await mintViewSession(context);
  expect(adapter.update).not.toHaveBeenCalled();
});
