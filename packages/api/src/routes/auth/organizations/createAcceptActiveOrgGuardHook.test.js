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

import createAcceptActiveOrgGuardHook from './createAcceptActiveOrgGuardHook.js';

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

function acceptCtx({ activeOrganizationId } = {}) {
  return {
    path: '/organization/accept-invitation',
    context: {
      session: {
        session: { id: 'sess_1', token: 'token_1', activeOrganizationId },
        user: { id: 'user_1', email: 'invited@example.com' },
      },
    },
  };
}

test('vetoes the active-organization switch when the session is already active elsewhere', async () => {
  const logger = mockLogger();
  const hook = createAcceptActiveOrgGuardHook({ logger });

  const result = await hook(
    { activeOrganizationId: 'org_b' },
    acceptCtx({ activeOrganizationId: 'org_a' })
  );

  expect(result).toBe(false);
  expect(logger.debug).toHaveBeenCalledWith(
    'Invitation accept for organization "org_b" left the session active in "org_a" - membership created, active organization unchanged.'
  );
});

test('lets the set through for an org-less session - the rescue path', async () => {
  const hook = createAcceptActiveOrgGuardHook({ logger: mockLogger() });

  const result = await hook(
    { activeOrganizationId: 'org_b' },
    acceptCtx({ activeOrganizationId: undefined })
  );

  expect(result).toBeUndefined();
});

test('lets a same-organization set through - pinned re-accept is a no-op write', async () => {
  const hook = createAcceptActiveOrgGuardHook({ logger: mockLogger() });

  const result = await hook(
    { activeOrganizationId: 'org_a' },
    acceptCtx({ activeOrganizationId: 'org_a' })
  );

  expect(result).toBeUndefined();
});

test('ignores session updates from every other endpoint - the explicit switch stays free', async () => {
  const hook = createAcceptActiveOrgGuardHook({ logger: mockLogger() });

  const result = await hook(
    { activeOrganizationId: 'org_b' },
    {
      path: '/organization/set-active',
      context: {
        session: {
          session: { id: 'sess_1', activeOrganizationId: 'org_a' },
        },
      },
    }
  );

  expect(result).toBeUndefined();
});

test('ignores accept-route session writes that do not set an active organization', async () => {
  const hook = createAcceptActiveOrgGuardHook({ logger: mockLogger() });

  const result = await hook(
    { activeTeamId: 'team_1' },
    acceptCtx({ activeOrganizationId: 'org_a' })
  );

  expect(result).toBeUndefined();
});

test('lets the set through when no endpoint context is available', async () => {
  const hook = createAcceptActiveOrgGuardHook({ logger: mockLogger() });

  const result = await hook({ activeOrganizationId: 'org_b' }, null);

  expect(result).toBeUndefined();
});
