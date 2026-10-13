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

import { callerStamp, parseCallerStamp } from '@lowdefy/helpers';

import hasOtherRoles from './hasOtherRoles.js';

const user = { id: 'user_1', organization_id: 'org_1', roles: ['editor', 'admin'] };

function stampFor(stampUser) {
  return parseCallerStamp(callerStamp({ user: stampUser }));
}

test('hasOtherRoles is false when the server answered with the rendered roles', () => {
  expect(hasOtherRoles({ stamp: stampFor(user), user })).toBe(false);
});

test('hasOtherRoles is false when the rendered roles are in another order', () => {
  expect(hasOtherRoles({ stamp: stampFor({ ...user, roles: ['admin', 'editor'] }), user })).toBe(
    false
  );
});

test('hasOtherRoles is true when a role was taken away', () => {
  expect(hasOtherRoles({ stamp: stampFor({ ...user, roles: ['editor'] }), user })).toBe(true);
});

test('hasOtherRoles is true when a role was granted', () => {
  expect(
    hasOtherRoles({ stamp: stampFor({ ...user, roles: ['editor', 'admin', 'owner'] }), user })
  ).toBe(true);
});

test('hasOtherRoles is false for an anonymous stamp, a stamp with no roles, or no stamp', () => {
  expect(hasOtherRoles({ stamp: parseCallerStamp(''), user })).toBe(false);
  expect(hasOtherRoles({ stamp: parseCallerStamp('82e92667feb5824d'), user })).toBe(false);
  expect(hasOtherRoles({ stamp: null, user })).toBe(false);
});

test('hasOtherRoles is false on an anonymous page', () => {
  expect(hasOtherRoles({ stamp: stampFor(user), user: null })).toBe(false);
});

test('hasOtherRoles compares a rendered caller with no roles as an empty list', () => {
  const noRoles = { id: 'user_1', organization_id: 'org_1' };
  expect(hasOtherRoles({ stamp: stampFor({ ...noRoles, roles: [] }), user: noRoles })).toBe(false);
});
