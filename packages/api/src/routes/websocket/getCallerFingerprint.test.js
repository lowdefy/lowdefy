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

import getCallerFingerprint from './getCallerFingerprint.js';
import { expect, test } from 'vitest';

const caller = {
  id: 'user-1',
  name: 'Ada',
  organization_id: 'org-1',
  roles: ['editor', 'admin'],
  attributes: { team: 'a' },
};

test('getCallerFingerprint returns null for an unauthenticated caller', () => {
  expect(getCallerFingerprint({ user: null })).toBe(null);
  expect(getCallerFingerprint({ user: undefined })).toBe(null);
});

test('getCallerFingerprint is the same whatever order the roles come in', () => {
  expect(getCallerFingerprint({ user: { ...caller, roles: ['admin', 'editor'] } })).toBe(
    getCallerFingerprint({ user: caller })
  );
});

test('getCallerFingerprint ignores caller fields other than id, organization and roles', () => {
  expect(
    getCallerFingerprint({ user: { ...caller, name: 'Ada L.', attributes: { team: 'b' } } })
  ).toBe(getCallerFingerprint({ user: caller }));
});

test.each([
  ['user id', { id: 'user-2' }],
  ['organization', { organization_id: 'org-2' }],
  ['roles', { roles: ['editor'] }],
])('getCallerFingerprint changes when the %s changes', (_, change) => {
  expect(getCallerFingerprint({ user: { ...caller, ...change } })).not.toBe(
    getCallerFingerprint({ user: caller })
  );
});

test('getCallerFingerprint does not reorder the caller roles in place', () => {
  const user = { ...caller, roles: ['editor', 'admin'] };
  getCallerFingerprint({ user });
  expect(user.roles).toEqual(['editor', 'admin']);
});

test('getCallerFingerprint of a view session changes when the scopes of its grant change', () => {
  const full = { clientId: 'client_1', grantedScopes: ['mcp:read', 'mcp:write'] };
  const narrowed = { clientId: 'client_1', grantedScopes: ['mcp:read'] };
  const opened = getCallerFingerprint({ user: caller, viewSession: full });
  expect(getCallerFingerprint({ user: caller, viewSession: narrowed })).not.toBe(opened);
  expect(
    getCallerFingerprint({
      user: caller,
      viewSession: { clientId: 'client_1', grantedScopes: ['mcp:write', 'mcp:read'] },
    })
  ).toBe(opened);
});

test('getCallerFingerprint of a caller that is not a view session is unchanged by the view field', () => {
  expect(getCallerFingerprint({ user: caller, viewSession: null })).toBe(
    getCallerFingerprint({ user: caller })
  );
  expect(JSON.parse(getCallerFingerprint({ user: caller }))).toEqual({
    id: caller.id ?? null,
    organizationId: caller.organization_id ?? null,
    roles: [...caller.roles].sort(),
  });
});
