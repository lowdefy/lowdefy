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

// Each slot is wrapped in createAuthMiddleware; mock it to identity so the unit
// test can invoke a slot with a plain endpoint context.
jest.unstable_mockModule('better-auth/api', () => ({
  createAuthMiddleware: (handler) => handler,
}));

const { default: buildRequestHooks } = await import('./buildRequestHooks.js');

const pinnedOrg = { id: 'org_pinned', slug: 'team-portal', name: 'team-portal' };
const organizations = { policy: 'pinned', org: 'team-portal', signup: 'invite-only' };

function createMockAuth({ invitations = [] } = {}) {
  const adapter = {
    findOne: jest.fn(async ({ model }) => (model === 'organization' ? pinnedOrg : null)),
    findMany: jest.fn(async () => invitations),
    create: jest.fn(async ({ model, data }) => ({ id: `${model}_new`, ...data })),
  };
  const internalAdapter = {
    findUserById: jest.fn(async () => null),
    findUserByEmail: jest.fn(async () => null),
  };
  return { $context: Promise.resolve({ adapter, internalAdapter }) };
}

test('buildRequestHooks returns a before and an after slot with no magic link configured', async () => {
  const getAuth = jest.fn();
  const hooks = buildRequestHooks({ authConfig: { organizations }, getAuth });
  expect(typeof hooks.before).toBe('function');
  expect(typeof hooks.after).toBe('function');
  expect(
    await hooks.before({ path: '/sign-in/magic-link', body: { email: 'x@example.com' } })
  ).toBe(undefined);
  expect(await hooks.after({ path: '/sign-in/magic-link' })).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('buildRequestHooks routes /sign-in/magic-link into the send gate when magicLink is enabled', async () => {
  const auth = createMockAuth({ invitations: [] });
  const hooks = buildRequestHooks({
    authConfig: { magicLink: { enabled: true }, organizations },
    getAuth: () => auth,
  });
  const result = await hooks.before({
    path: '/sign-in/magic-link',
    body: { email: 'stranger@example.com' },
  });
  expect(result).toEqual({ status: true });
});

test('buildRequestHooks leaves paths other than /sign-in/magic-link alone when magicLink is enabled', async () => {
  const getAuth = jest.fn();
  const hooks = buildRequestHooks({
    authConfig: { magicLink: { enabled: true }, organizations },
    getAuth,
  });
  expect(
    await hooks.before({ path: '/sign-in/email', body: { email: 'stranger@example.com' } })
  ).toBeUndefined();
  expect(
    await hooks.after({ path: '/sign-in/magic-link', body: { email: 'stranger@example.com' } })
  ).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('buildRequestHooks does not resolve the BetterAuth instance while assembling', () => {
  const getAuth = jest.fn();
  buildRequestHooks({ authConfig: { magicLink: { enabled: true }, organizations }, getAuth });
  expect(getAuth).not.toHaveBeenCalled();
});
