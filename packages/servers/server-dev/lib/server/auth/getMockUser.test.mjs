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

async function importGetMockUser({ auth }) {
  authJson = auth;
  jest.resetModules();
  const { default: getMockUser } = await import('./getMockUser.js');
  return getMockUser;
}

afterEach(() => {
  delete process.env.LOWDEFY_DEV_USER;
});

test('getMockUser returns null when no dev browser user is declared', async () => {
  const getMockUser = await importGetMockUser({ auth: { configured: true } });

  expect(getMockUser()).toBe(null);
});

test('getMockUser returns the dev.users entry named by dev.browserUser', async () => {
  const getMockUser = await importGetMockUser({
    auth: {
      configured: true,
      dev: {
        browserUser: 'admin',
        users: {
          admin: { id: 'dev-admin', roles: ['admin'] },
          member: { id: 'dev-member', roles: ['member'] },
        },
      },
    },
  });

  expect(getMockUser()).toEqual({ id: 'dev-admin', roles: ['admin'] });
});

test('getMockUser throws when dev.browserUser names no declared dev user', async () => {
  const getMockUser = await importGetMockUser({
    auth: {
      configured: true,
      dev: { browserUser: 'admn', users: { admin: { id: 'dev-admin' } } },
    },
  });

  expect(() => getMockUser()).toThrow('Unknown dev user "admn"');
});

test('getMockUser still resolves the deprecated dev.mockUser', async () => {
  const getMockUser = await importGetMockUser({
    auth: { configured: true, dev: { mockUser: { id: 'dev', roles: ['admin'] } } },
  });

  expect(getMockUser()).toEqual({ id: 'dev', roles: ['admin'] });
});

test('getMockUser prefers LOWDEFY_DEV_USER over dev.browserUser', async () => {
  const getMockUser = await importGetMockUser({
    auth: {
      configured: true,
      dev: { browserUser: 'admin', users: { admin: { id: 'dev-admin', roles: ['admin'] } } },
    },
  });
  process.env.LOWDEFY_DEV_USER = JSON.stringify({ id: 'env-user', roles: ['env'] });

  expect(getMockUser()).toEqual({ id: 'env-user', roles: ['env'] });
});

test('getMockUser throws when LOWDEFY_DEV_USER is not valid JSON', async () => {
  const getMockUser = await importGetMockUser({ auth: { configured: true } });
  process.env.LOWDEFY_DEV_USER = 'not json';

  expect(() => getMockUser()).toThrow('Invalid JSON in LOWDEFY_DEV_USER environment variable.');
});

test('getMockUser resolves the browser user when auth.dev is the only auth config', async () => {
  const getMockUser = await importGetMockUser({
    auth: {
      configured: false,
      dev: { browserUser: 'admin', users: { admin: { id: 'dev-admin', roles: ['admin'] } } },
    },
  });

  expect(getMockUser()).toEqual({ id: 'dev-admin', roles: ['admin'] });
});
