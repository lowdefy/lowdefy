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

// The gate wraps its handler in createAuthMiddleware; mock it to identity so
// the unit test can invoke the handler with a plain endpoint context.
jest.unstable_mockModule('better-auth/api', () => ({
  createAuthMiddleware: (handler) => handler,
}));

const { default: createMagicLinkSendGate } = await import('./createMagicLinkSendGate.js');

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const pinnedOrg = { id: 'org_pinned', slug: 'team-portal', name: 'team-portal' };

function createMockAuth({ member = null, invitations = [] } = {}) {
  const adapter = {
    findOne: jest.fn(async ({ model }) => (model === 'organization' ? pinnedOrg : member)),
    findMany: jest.fn(async () => invitations),
    create: jest.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: jest.fn(async () => null),
    findUserByEmail: jest.fn(async () => null),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  return { auth, adapter, internalAdapter };
}

const pinned = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };

test('createMagicLinkSendGate falls through for a non-magic-link path without resolving auth', async () => {
  const getAuth = jest.fn();
  const gate = createMagicLinkSendGate({ getAuth, organizations: pinned });
  const result = await gate({ path: '/sign-in/email', body: { email: 'x@example.com' } });
  expect(result).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('createMagicLinkSendGate falls through when the body has no email', async () => {
  const getAuth = jest.fn();
  const gate = createMagicLinkSendGate({ getAuth, organizations: pinned });
  const result = await gate({ path: '/sign-in/magic-link', body: {} });
  expect(result).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('createMagicLinkSendGate falls through so the send proceeds for an admitted email', async () => {
  const { auth } = createMockAuth({
    member: null,
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const gate = createMagicLinkSendGate({ getAuth: () => auth, organizations: pinned });
  const result = await gate({
    path: '/sign-in/magic-link',
    body: { email: 'invited@example.com' },
  });
  expect(result).toBeUndefined();
});

test('createMagicLinkSendGate suppresses the send with a uniform { status: true } for an unadmitted email', async () => {
  const { auth } = createMockAuth({ member: null, invitations: [] });
  const gate = createMagicLinkSendGate({ getAuth: () => auth, organizations: pinned });
  const result = await gate({
    path: '/sign-in/magic-link',
    body: { email: 'stranger@example.com' },
  });
  expect(result).toEqual({ status: true });
});
