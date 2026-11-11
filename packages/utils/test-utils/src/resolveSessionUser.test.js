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

import { expect, test } from 'vitest';

import resolveSessionUser from './resolveSessionUser.js';

const finance = { id: 'u_finance', roles: ['finance'] };
const testSession = {
  dataSet: { name: 'billing', users: { finance, viewer: { id: 'u_viewer', roles: [] } } },
  named: true,
};

test('resolveSessionUser returns the data set user a name names', () => {
  expect(resolveSessionUser({ testSession, user: 'finance' })).toBe(finance);
});

test('resolveSessionUser returns null for "none", a signed out caller', () => {
  expect(resolveSessionUser({ testSession, user: 'none' })).toBeNull();
});

test('resolveSessionUser returns a user object as given', () => {
  const user = { id: 'u_1', roles: ['admin'], organization_id: 'org_a' };
  expect(resolveSessionUser({ testSession, user })).toBe(user);
});

test('resolveSessionUser refuses a name the data set does not have, listing its users', () => {
  expect(() => resolveSessionUser({ testSession, user: 'admin' })).toThrow(
    'User "admin" is not in data set "billing". Its users are "finance", "viewer".'
  );
});

test('resolveSessionUser refuses a name on a session opened without a data set', () => {
  expect(() =>
    resolveSessionUser({
      testSession: { dataSet: { name: '(no data set)', users: {} }, named: false },
      user: 'finance',
    })
  ).toThrow(
    'User "finance" is not in the session, which was opened without a data set. It has no users.'
  );
});

test('resolveSessionUser refuses a user that is not a name, an object or "none"', () => {
  expect(() => resolveSessionUser({ testSession, user: undefined })).toThrow(
    "as() takes a user: the name of a user in the session's data set"
  );
  expect(() => resolveSessionUser({ testSession, user: '' })).toThrow('Received "".');
  expect(() => resolveSessionUser({ testSession, user: ['finance'] })).toThrow(
    'Received ["finance"].'
  );
});
