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

import resolveViewSession from './resolveViewSession.js';

const NOW = new Date('2026-11-12T10:00:00Z').getTime();

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createContext() {
  return { logger: { debug: vi.fn() } };
}

function createAdapter({ consent = { scopes: ['mcp:read', 'mcp:write'] } } = {}) {
  return { findOne: vi.fn().mockResolvedValue(consent) };
}

function createSession({ session, user } = {}) {
  return {
    user: { id: 'user_1', ...user },
    session: {
      id: 'sess_1',
      activeOrganizationId: 'org_1',
      createdAt: new Date(NOW - 60 * 1000),
      view: true,
      viewClientId: 'client_1',
      viewScopes: 'mcp:read mcp:write',
      ...session,
    },
  };
}

test('resolveViewSession returns the grant client and scopes while the consent row stands', async () => {
  const adapter = createAdapter();
  expect(await resolveViewSession(createContext(), { adapter, session: createSession() })).toEqual({
    clientId: 'client_1',
    grantedScopes: ['mcp:read', 'mcp:write'],
  });
  expect(adapter.findOne).toHaveBeenCalledWith({
    model: 'oauthConsent',
    where: [
      { field: 'clientId', value: 'client_1' },
      { field: 'userId', value: 'user_1' },
      { field: 'referenceId', value: 'org_1' },
    ],
  });
});

test('resolveViewSession returns null when the grant was revoked', async () => {
  const context = createContext();
  const adapter = createAdapter({ consent: null });
  expect(await resolveViewSession(context, { adapter, session: createSession() })).toBeNull();
  expect(context.logger.debug).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'auth_view_session_grant_revoked', clientId: 'client_1' }),
    expect.any(String)
  );
});

test('resolveViewSession returns a read-only session its read scope alone', async () => {
  expect(
    await resolveViewSession(createContext(), {
      adapter: createAdapter(),
      session: createSession({ session: { viewScopes: 'mcp:read' } }),
    })
  ).toEqual({ clientId: 'client_1', grantedScopes: ['mcp:read'] });
});

test('resolveViewSession cuts the recorded scopes to the ones the consent row still carries', async () => {
  expect(
    await resolveViewSession(createContext(), {
      adapter: createAdapter({ consent: { scopes: ['mcp:read', 'offline_access'] } }),
      session: createSession(),
    })
  ).toEqual({ clientId: 'client_1', grantedScopes: ['mcp:read'] });
});

test('resolveViewSession never passes on a scope outside the MCP vocabulary', async () => {
  expect(
    await resolveViewSession(createContext(), {
      adapter: createAdapter({ consent: { scopes: ['mcp:read', 'admin'] } }),
      session: createSession({ session: { viewScopes: 'mcp:read admin' } }),
    })
  ).toEqual({ clientId: 'client_1', grantedScopes: ['mcp:read'] });
});

test('resolveViewSession returns null for a session older than fifteen minutes, whatever its expiry says', async () => {
  const adapter = createAdapter();
  const session = createSession({
    session: {
      createdAt: new Date(NOW - 15 * 60 * 1000),
      expiresAt: new Date(NOW + 7 * 24 * 60 * 60 * 1000),
    },
  });
  expect(await resolveViewSession(createContext(), { adapter, session })).toBeNull();
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('resolveViewSession returns null for a session with no readable creation time', async () => {
  const session = createSession({ session: { createdAt: undefined } });
  expect(
    await resolveViewSession(createContext(), { adapter: createAdapter(), session })
  ).toBeNull();
});

test('resolveViewSession returns null for a session that names no client or no organization', async () => {
  const adapter = createAdapter();
  expect(
    await resolveViewSession(createContext(), {
      adapter,
      session: createSession({ session: { viewClientId: undefined } }),
    })
  ).toBeNull();
  expect(
    await resolveViewSession(createContext(), {
      adapter,
      session: createSession({ session: { activeOrganizationId: null } }),
    })
  ).toBeNull();
  expect(adapter.findOne).not.toHaveBeenCalled();
});

test('resolveViewSession returns null for a banned user and admits one whose ban has passed', async () => {
  const adapter = createAdapter();
  expect(
    await resolveViewSession(createContext(), {
      adapter,
      session: createSession({ user: { banned: true } }),
    })
  ).toBeNull();
  expect(
    await resolveViewSession(createContext(), {
      adapter,
      session: createSession({ user: { banned: true, banExpires: new Date(NOW - 1000) } }),
    })
  ).not.toBeNull();
});
