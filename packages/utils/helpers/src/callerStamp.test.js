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

import { createHash } from 'node:crypto';

import callerStamp from './callerStamp.js';
import { expect, test } from 'vitest';

function sha256Prefix(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

const user = { id: 'user_1', organization_id: 'org_1', roles: ['editor', 'admin'] };
const authSession = { id: 'session_1', memberOrganizationIds: ['org_2', 'org_1'] };

// Fixed vector: the same header is asserted by the server's stampCaller and the
// client's shouldReloadForCaller tests, so both sides are pinned to one stamp.
const FULL_STAMP =
  '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d';

test('callerStamp names the caller, session, roles and memberships of a session caller', () => {
  expect(callerStamp({ user, authSession })).toBe(FULL_STAMP);
});

test('callerStamp hashes the session id, the sorted roles and the sorted organization ids', () => {
  expect(callerStamp({ user, authSession })).toBe(
    [
      sha256Prefix('user_1:org_1'),
      `session=${sha256Prefix('session_1')}`,
      `roles=${sha256Prefix('{"roles":["admin","editor"],"org_roles":[]}')}`,
      `memberships=${sha256Prefix('["org_1","org_2"]')}`,
    ].join('; ')
  );
});

test('callerStamp is empty for an anonymous caller, session or not', () => {
  expect(callerStamp({ user: null, authSession })).toBe('');
  expect(callerStamp({ user: undefined })).toBe('');
});

test('callerStamp leaves out session and memberships for a caller with no session', () => {
  expect(callerStamp({ user })).toBe('82e92667feb5824d; roles=228d50a09b1b1e2b');
  expect(callerStamp({ user, authSession: null })).toBe('82e92667feb5824d; roles=228d50a09b1b1e2b');
});

test('callerStamp leaves out memberships when the member rows were not read', () => {
  expect(callerStamp({ user, authSession: { id: 'session_1', memberOrganizationIds: null } })).toBe(
    '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b'
  );
});

test('callerStamp hashes no roles as an empty list', () => {
  expect(callerStamp({ user: { id: 'user_1', organization_id: 'org_1', roles: [] } })).toBe(
    `82e92667feb5824d; roles=${sha256Prefix('{"roles":[],"org_roles":[]}')}`
  );
});

test('callerStamp hashes memberships of a person in no organization as an empty list', () => {
  expect(callerStamp({ user, authSession: { id: 'session_1', memberOrganizationIds: [] } })).toBe(
    `82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=${sha256Prefix(
      '[]'
    )}`
  );
});

test('callerStamp does not change with the order of roles or memberships', () => {
  expect(
    callerStamp({
      user: { ...user, roles: ['admin', 'editor'] },
      authSession: { id: 'session_1', memberOrganizationIds: ['org_1', 'org_2'] },
    })
  ).toBe(FULL_STAMP);
});

test('callerStamp changes roles alone when a role is added', () => {
  const before = callerStamp({ user, authSession });
  const after = callerStamp({
    user: { ...user, roles: ['editor', 'admin', 'owner'] },
    authSession,
  });
  expect(after.split('; ')[0]).toBe(before.split('; ')[0]);
  expect(after.split('; ')[1]).toBe(before.split('; ')[1]);
  expect(after.split('; ')[2]).not.toBe(before.split('; ')[2]);
  expect(after.split('; ')[3]).toBe(before.split('; ')[3]);
});

test('callerStamp does not mistake two roles for one role holding a comma', () => {
  const two = callerStamp({ user: { ...user, roles: ['a', 'b'] } });
  const one = callerStamp({ user: { ...user, roles: ['a,b'] } });
  expect(two).not.toBe(one);
});
