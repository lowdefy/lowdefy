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

const { default: resolveHeadlessUser } = await import('./resolveHeadlessUser.js');
const { headlessUser } = await import('./headlessUser.js');

beforeEach(() => {
  mockGetDevUsers.mockReturnValue({
    admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
    member: { id: 'dev-member', roles: ['member'] },
  });
});

test('resolveHeadlessUser returns the default roleless user when no user is given', () => {
  expect(resolveHeadlessUser({})).toEqual({
    id: 'lowdefy-headless',
    name: 'Lowdefy Headless',
    roles: [],
  });
});

test('resolveHeadlessUser returns the default roleless user when user is null', () => {
  expect(resolveHeadlessUser({ user: null })).toEqual(headlessUser);
});

test('resolveHeadlessUser merges roles over the default, keeping the default id and name', () => {
  expect(resolveHeadlessUser({ user: { roles: ['user-admin'] } })).toEqual({
    id: 'lowdefy-headless',
    name: 'Lowdefy Headless',
    roles: ['user-admin'],
  });
});

test('resolveHeadlessUser keeps caller fields the app reads, like email and profile', () => {
  expect(
    resolveHeadlessUser({
      user: { id: 'agent', email: 'agent@example.com', profile: { name: 'Agent' } },
    })
  ).toEqual({
    id: 'agent',
    name: 'Lowdefy Headless',
    email: 'agent@example.com',
    profile: { name: 'Agent' },
    roles: [],
  });
});

test('resolveHeadlessUser does not mutate the default user between calls', () => {
  resolveHeadlessUser({ user: { id: 'first', roles: ['admin'] } });

  expect(resolveHeadlessUser({})).toEqual({
    id: 'lowdefy-headless',
    name: 'Lowdefy Headless',
    roles: [],
  });
});

test('resolveHeadlessUser merges a named dev user fixture over the default', () => {
  expect(resolveHeadlessUser({ user: 'admin' })).toEqual({
    id: 'dev-admin',
    name: 'Lowdefy Headless',
    roles: ['admin'],
    organization_id: 'org_1',
  });
});

test('resolveHeadlessUser throws when the dev user name is not declared', () => {
  expect(() => resolveHeadlessUser({ user: 'adin' })).toThrow(
    'Unknown dev user "adin". Declare it under auth.dev.users in lowdefy.yaml, or pass an inline user object. Declared: admin, member.'
  );
});

test('resolveHeadlessUser throws when user is an array', () => {
  expect(() => resolveHeadlessUser({ user: ['admin'] })).toThrow(
    'Headless "user" must be a dev user name or an object. Received ["admin"].'
  );
});
