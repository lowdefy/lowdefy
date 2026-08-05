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

import authorizeRole from './authorizeRole.js';

test('authorizeRole passes admin for member update', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: 'admin' })).toBe(true);
});

test('authorizeRole refuses member for member update', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: 'member' })).toBe(false);
});

test('authorizeRole passes when any role in the stored CSV authorizes', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: 'member,admin' })).toBe(true);
});

test('authorizeRole tolerates whitespace around CSV entries', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: ' member , admin ' })).toBe(
    true
  );
});

test('authorizeRole returns false for an empty, null or undefined role', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: '' })).toBe(false);
  expect(authorizeRole({ permissions: { member: ['update'] }, role: null })).toBe(false);
  expect(authorizeRole({ permissions: { member: ['update'] }, role: undefined })).toBe(false);
});

test('authorizeRole returns false for an unregistered role name', () => {
  expect(authorizeRole({ permissions: { member: ['update'] }, role: 'branch-manager' })).toBe(
    false
  );
});

test('authorizeRole answers the added actions the vendored statements do not carry', () => {
  expect(authorizeRole({ permissions: { user: ['ban'] }, role: 'owner' })).toBe(true);
  expect(authorizeRole({ permissions: { user: ['ban'] }, role: 'member' })).toBe(false);
  expect(authorizeRole({ permissions: { session: ['revoke'] }, role: 'admin' })).toBe(true);
});

test('authorizeRole requires every action in a resource list', () => {
  expect(
    authorizeRole({ permissions: { organization: ['update', 'delete'] }, role: 'admin' })
  ).toBe(false);
  expect(
    authorizeRole({ permissions: { organization: ['update', 'delete'] }, role: 'owner' })
  ).toBe(true);
});
