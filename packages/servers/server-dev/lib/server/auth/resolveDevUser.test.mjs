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

const mockGetDevUsers = jest.fn();

jest.unstable_mockModule('./getDevUsers.js', () => ({
  default: mockGetDevUsers,
}));

const { default: resolveDevUser } = await import('./resolveDevUser.js');

const devUsers = {
  admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
  member: { id: 'dev-member', roles: ['member'], organization_id: 'org_1' },
};

beforeEach(() => {
  mockGetDevUsers.mockReturnValue(devUsers);
});

test('resolveDevUser returns undefined when no user is given', () => {
  expect(resolveDevUser({})).toBeUndefined();
  expect(resolveDevUser({ user: null })).toBeUndefined();
});

test('resolveDevUser returns the fixture declared under that name', () => {
  expect(resolveDevUser({ user: 'admin' })).toEqual({
    id: 'dev-admin',
    roles: ['admin'],
    organization_id: 'org_1',
  });
});

test('resolveDevUser returns an inline user object unchanged', () => {
  const user = { roles: ['user-admin'], email: 'agent@example.com' };

  expect(resolveDevUser({ user })).toBe(user);
});

test('resolveDevUser throws and lists the declared names when the name is unknown', () => {
  expect(() => resolveDevUser({ user: 'adin' })).toThrow(
    'Unknown dev user "adin". Declare it under auth.dev.users in lowdefy.yaml, or pass an inline user object. Declared: admin, member.'
  );
});

test('resolveDevUser throws pointing at auth.dev.users when no fixtures are declared', () => {
  mockGetDevUsers.mockReturnValue({});

  expect(() => resolveDevUser({ user: 'admin' })).toThrow(
    'No dev users are declared. Add auth.dev.users to lowdefy.yaml, or pass an inline user object.'
  );
});

test('resolveDevUser does not resolve a name to an Object prototype member', () => {
  expect(() => resolveDevUser({ user: 'constructor' })).toThrow('Unknown dev user "constructor".');
});

test('resolveDevUser throws when the user is a number', () => {
  expect(() => resolveDevUser({ user: 42 })).toThrow(
    'Headless "user" must be a dev user name or an object. Received 42.'
  );
});

test('resolveDevUser throws when the user is an array', () => {
  expect(() => resolveDevUser({ user: ['admin'] })).toThrow(
    'Headless "user" must be a dev user name or an object. Received ["admin"].'
  );
});
