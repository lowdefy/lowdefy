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

// build/auth.js reads build/auth.json from the server's working directory,
// which only exists in a running app, so the artifact is mocked per test.
let authJson = {};

jest.unstable_mockModule('../../build/auth.js', () => ({
  get default() {
    return authJson;
  },
}));

async function importGetDevUsers({ auth }) {
  authJson = auth;
  jest.resetModules();
  const { default: getDevUsers } = await import('./getDevUsers.js');
  return getDevUsers;
}

test('getDevUsers returns an empty object when auth.dev.users is absent', async () => {
  const getDevUsers = await importGetDevUsers({ auth: { configured: true } });

  expect(getDevUsers()).toEqual({});
});

test('getDevUsers returns an empty object when the auth artifact has no dev block', async () => {
  const getDevUsers = await importGetDevUsers({ auth: {} });

  expect(getDevUsers()).toEqual({});
});

test('getDevUsers returns the declared fixtures', async () => {
  const getDevUsers = await importGetDevUsers({
    auth: {
      dev: {
        users: {
          admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
          member: { id: 'dev-member', roles: ['member'] },
        },
      },
    },
  });

  expect(getDevUsers()).toEqual({
    admin: { id: 'dev-admin', roles: ['admin'], organization_id: 'org_1' },
    member: { id: 'dev-member', roles: ['member'] },
  });
});

test('getDevUsers deserializes build markers in the fixtures', async () => {
  const getDevUsers = await importGetDevUsers({
    auth: {
      dev: {
        users: {
          admin: { id: 'dev-admin', roles: { '~arr': ['admin'] } },
        },
      },
    },
  });

  expect(getDevUsers().admin.roles).toEqual(['admin']);
});

test('getDevUsers does not require auth to be configured', async () => {
  const getDevUsers = await importGetDevUsers({
    auth: { configured: false, dev: { users: { admin: { id: 'dev-admin' } } } },
  });

  expect(getDevUsers()).toEqual({ admin: { id: 'dev-admin' } });
});

test('getDevUsers memoizes, so it reads the artifact once', async () => {
  const getDevUsers = await importGetDevUsers({
    auth: { dev: { users: { admin: { id: 'dev-admin' } } } },
  });
  const first = getDevUsers();
  authJson = { dev: { users: { member: { id: 'dev-member' } } } };

  expect(getDevUsers()).toBe(first);
});
