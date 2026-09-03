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

jest.unstable_mockModule('../../../lib/server/auth/getDevUsers.js', () => ({
  default: mockGetDevUsers,
}));

const { default: parseUserParam } = await import('./parseUserParam.js');

beforeEach(() => {
  mockGetDevUsers.mockReturnValue({
    admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
    member: { id: 'dev-member', roles: ['member'] },
  });
});

test('parseUserParam returns nothing when the param is absent', () => {
  expect(parseUserParam({ value: undefined })).toEqual({});
});

test('parseUserParam parses a JSON string from a query param', () => {
  expect(parseUserParam({ value: '{"roles":["admin"]}' })).toEqual({
    user: { roles: ['admin'] },
  });
});

test('parseUserParam passes an object from a JSON body through', () => {
  expect(parseUserParam({ value: { roles: ['admin'] } })).toEqual({
    user: { roles: ['admin'] },
  });
});

test('parseUserParam resolves a bare fixture name to the declared dev user', () => {
  expect(parseUserParam({ value: 'admin' })).toEqual({
    user: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
  });
});

test('parseUserParam returns an error naming the declared fixtures for an unknown name', () => {
  expect(parseUserParam({ value: 'adin' }).error).toBe(
    'Unknown dev user "adin". Declare it under auth.dev.users in lowdefy.yaml, or pass an inline user object. Declared: admin, member.'
  );
});

test('parseUserParam returns an error when no fixtures are declared', () => {
  mockGetDevUsers.mockReturnValue({});

  expect(parseUserParam({ value: 'admin' }).error).toBe(
    'No dev users are declared. Add auth.dev.users to lowdefy.yaml, or pass an inline user object.'
  );
});

test('parseUserParam parses a JSON string that is indented before the brace', () => {
  expect(parseUserParam({ value: '  {"roles":["admin"]}' })).toEqual({
    user: { roles: ['admin'] },
  });
});

test('parseUserParam returns an error when a value starting with a brace is not JSON', () => {
  expect(parseUserParam({ value: '{roles:admin}' }).error).toMatch(/must be JSON/);
});

test('parseUserParam returns an error when a body value is not a name or an object', () => {
  expect(parseUserParam({ value: 42 }).error).toMatch(/must be a dev user name or an object/);
  expect(parseUserParam({ value: ['admin'] }).error).toMatch(
    /must be a dev user name or an object/
  );
});
