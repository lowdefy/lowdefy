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
import { type } from '@lowdefy/helpers';

import createEmailSendGate from './createEmailSendGate.js';

const future = new Date(Date.now() + 3600 * 1000).toISOString();
const past = new Date(Date.now() - 3600 * 1000).toISOString();
const pinnedOrg = { id: 'team-portal', slug: 'team-portal', name: 'team-portal' };

function createMockAuth({ user = null, members = [], invitations = [] } = {}) {
  const adapter = {
    findOne: vi.fn(async ({ model }) => (model === 'organization' ? pinnedOrg : null)),
    findMany: vi.fn(async ({ model }) => (model === 'member' ? members : invitations)),
    create: vi.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: vi.fn(async () => user),
    findUserByEmail: vi.fn(async () => (type.isNone(user) ? null : { user, accounts: [] })),
  };
  const auth = { $context: Promise.resolve({ adapter, internalAdapter }) };
  return { auth, adapter, internalAdapter };
}

function createLogger() {
  return { info: vi.fn() };
}

const pinned = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };

test('createEmailSendGate falls through when the body has no email', async () => {
  const getAuth = vi.fn();
  const gate = createEmailSendGate({
    getAuth,
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: {} });
  expect(result).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('createEmailSendGate falls through so the send proceeds for an admitted email', async () => {
  const { auth } = createMockAuth({
    invitations: [{ id: 'inv_1', status: 'pending', expiresAt: future }],
  });
  const gate = createEmailSendGate({
    getAuth: () => auth,
    logger: createLogger(),
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: { email: 'invited@example.com' } });
  expect(result).toBeUndefined();
});

test('createEmailSendGate suppresses the magic-link send with its { status: true } body for an unadmitted email', async () => {
  const { auth } = createMockAuth();
  const gate = createEmailSendGate({
    getAuth: () => auth,
    logger: createLogger(),
    organizations: pinned,
    successBody: { status: true },
  });
  const result = await gate({ body: { email: 'stranger@example.com' } });
  expect(result).toEqual({ status: true });
});

// The OTP send route answers { success: true }, not { status: true } - a
// suppressed send has to be indistinguishable from a real one on the wire.
test('createEmailSendGate suppresses the OTP send with its { success: true } body for an unadmitted email', async () => {
  const { auth } = createMockAuth();
  const gate = createEmailSendGate({
    getAuth: () => auth,
    logger: createLogger(),
    organizations: pinned,
    successBody: { success: true },
  });
  const result = await gate({ body: { email: 'stranger@example.com' } });
  expect(result).toEqual({ success: true });
});

// LDF-849: a banned user is sent nothing on either send route, under every
// signup policy, and gets the same body a real send answers with.
const routes = [
  { route: 'magic-link', successBody: { status: true } },
  { route: 'one-time code', successBody: { success: true } },
];
const policies = [
  { name: 'pinned', organizations: pinned },
  { name: 'tenant', organizations: { policy: 'tenant', signup: 'invite-only' } },
  { name: 'open signup', organizations: { policy: 'pinned', org: 'team-portal', signup: 'open' } },
];
const matrix = routes.flatMap((route) => policies.map((policy) => ({ ...route, ...policy })));

const memberRow = { id: 'member_1', userId: 'user_1', organizationId: 'team-portal' };

function runGate({ organizations, successBody, user }) {
  const { auth } = createMockAuth({ user, members: [memberRow] });
  const logger = createLogger();
  const gate = createEmailSendGate({ getAuth: () => auth, logger, organizations, successBody });
  return { logger, result: gate({ body: { email: 'Member@Example.com' } }) };
}

test.each(matrix)(
  'createEmailSendGate suppresses the $route send for a banned member with no expiry under $name',
  async ({ organizations, successBody }) => {
    const { logger, result } = runGate({
      organizations,
      successBody,
      user: { id: 'user_1', email: 'member@example.com', banned: true, banExpires: null },
    });
    expect(await result).toEqual(successBody);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'auth_email_send_banned', userId: 'user_1' },
      expect.not.stringContaining('example.com')
    );
  }
);

test.each(matrix)(
  'createEmailSendGate suppresses the $route send for a banned member with a future expiry under $name',
  async ({ organizations, successBody }) => {
    const { logger, result } = runGate({
      organizations,
      successBody,
      user: { id: 'user_1', email: 'member@example.com', banned: true, banExpires: future },
    });
    expect(await result).toEqual(successBody);
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'auth_email_send_banned', userId: 'user_1' },
      expect.any(String)
    );
  }
);

test.each(matrix)(
  'createEmailSendGate lets the $route send proceed for a member whose ban has expired under $name',
  async ({ organizations, successBody }) => {
    const { logger, result } = runGate({
      organizations,
      successBody,
      user: { id: 'user_1', email: 'member@example.com', banned: true, banExpires: past },
    });
    expect(await result).toBeUndefined();
    expect(logger.info).not.toHaveBeenCalled();
  }
);

test.each(matrix)(
  'createEmailSendGate lets the $route send proceed for an unbanned member under $name',
  async ({ organizations, successBody }) => {
    const { logger, result } = runGate({
      organizations,
      successBody,
      user: { id: 'user_1', email: 'member@example.com', banned: false },
    });
    expect(await result).toBeUndefined();
    expect(logger.info).not.toHaveBeenCalled();
  }
);

test('createEmailSendGate looks the user up by the lowercased email', async () => {
  const { auth, internalAdapter } = createMockAuth();
  const gate = createEmailSendGate({
    getAuth: () => auth,
    logger: createLogger(),
    organizations: pinned,
    successBody: { status: true },
  });
  await gate({ body: { email: 'Member@Example.com' } });
  expect(internalAdapter.findUserByEmail).toHaveBeenCalledWith('member@example.com');
});
