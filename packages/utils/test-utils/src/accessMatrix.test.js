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

import { afterEach, expect, test } from 'vitest';

import writeTestBuild from '../test/writeTestBuild.mjs';
import openTestApp from './openTestApp.js';

// These tests run on a build written by hand (test/writeTestBuild.mjs), so they need no app
// build. The same table over real builds of three apps is in test/fixtureApps (test:fixture).

// Pages protected by default, a second factor required, and two-factor-enrol the enrolment page.
// Written out of order, as a build may list them.
const authJson = {
  configured: true,
  pagesProtectedByDefault: true,
  twoFactor: { enabled: true, required: true },
  authPages: { signIn: '/login', twoFactorEnrol: '/two-factor-enrol' },
};

const routes = [
  { pageId: 'two-factor-enrol', path: 'two-factor-enrol', auth: { public: false } },
  { pageId: 'home', path: 'home', auth: { public: true } },
  { pageId: 'reports', path: 'reports', auth: { public: false, roles: ['auditor'] } },
  { pageId: 'dashboard', path: 'dashboard', auth: { public: false } },
  { pageId: 'Zebra', path: 'Zebra', auth: { public: true } },
];

const endpoints = [
  { id: 'endpoint:whoami', type: 'Api', endpointId: 'whoami', auth: { public: true } },
  {
    id: 'endpoint:list-reports',
    type: 'Api',
    endpointId: 'list-reports',
    auth: { public: false, roles: ['auditor'] },
  },
  // Built with auth.public true: only the app's own hooks call it.
  {
    id: 'endpoint:audit-login',
    type: 'InternalApi',
    endpointId: 'audit-login',
    auth: { public: true },
  },
  {
    id: 'endpoint:account-kit/save-profile',
    type: 'Api',
    endpointId: 'account-kit/save-profile',
    auth: { public: false },
  },
];

const dataSets = {
  roles: {
    users: {
      unenrolled_auditor: { id: 'u_3', roles: ['auditor'], two_factor_enrolled: false },
      member: { id: 'u_2', roles: ['member'], two_factor_enrolled: true },
      auditor: { id: 'u_1', roles: ['auditor'], two_factor_enrolled: true },
    },
  },
  personas: {
    users: {
      admin: { id: 'u_4', roles: ['admin'] },
    },
  },
};

const builds = [];

async function openBuild(build) {
  const written = writeTestBuild(build);
  builds.push(written);
  const { configDirectory, serverDirectory } = written;
  return openTestApp({ configDirectory, serverDirectory });
}

afterEach(() => {
  builds.splice(0).forEach((build) => build.remove());
});

test('accessMatrix allows a public page for every user and for a signed out caller', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.home).toEqual({
    auditor: 'allow',
    member: 'allow',
    none: 'allow',
    unenrolled_auditor: 'allow',
  });
});

test('accessMatrix allows a role-gated page for its role and denies another role and a signed out caller', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.reports).toMatchObject({ auditor: 'allow', member: 'deny', none: 'deny' });
});

test('accessMatrix allows a protected page for every signed in user and denies a signed out caller', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.dashboard).toMatchObject({ auditor: 'allow', member: 'allow', none: 'deny' });
});

test('accessMatrix allows a role-gated endpoint for its role and denies another role and a signed out caller', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints['list-reports']).toEqual({
    auditor: 'allow',
    member: 'deny',
    none: 'deny',
    unenrolled_auditor: 'enrol_required',
  });
  expect(matrix.endpoints.whoami).toEqual({
    auditor: 'allow',
    member: 'allow',
    none: 'allow',
    unenrolled_auditor: 'allow',
  });
});

test('accessMatrix answers enrol_required for an unenrolled user on a page they could otherwise open', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.reports.unenrolled_auditor).toEqual('enrol_required');
  expect(matrix.pages.dashboard.unenrolled_auditor).toEqual('enrol_required');
});

test('accessMatrix allows an unenrolled user on the enrolment page', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages['two-factor-enrol']).toEqual({
    auditor: 'allow',
    member: 'allow',
    none: 'deny',
    unenrolled_auditor: 'allow',
  });
});

test('accessMatrix denies an unenrolled user a page their roles do not open, rather than asking them to enrol', async () => {
  const app = await openBuild({
    authJson,
    dataSets,
    endpoints,
    routes: [{ pageId: 'admin', path: 'admin', auth: { public: false, roles: ['admin'] } }],
  });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.admin.unenrolled_auditor).toEqual('deny');
});

test('accessMatrix asks no user to enrol when the app does not require a second factor', async () => {
  const app = await openBuild({
    authJson: { ...authJson, twoFactor: { enabled: true, required: false } },
    dataSets,
    endpoints,
    routes,
  });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.pages.reports.unenrolled_auditor).toEqual('allow');
  expect(matrix.pages.dashboard.unenrolled_auditor).toEqual('allow');
});

test('accessMatrix denies every caller an InternalApi endpoint, whatever its auth says', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints['audit-login']).toEqual({
    auditor: 'deny',
    member: 'deny',
    none: 'deny',
    unenrolled_auditor: 'deny',
  });
});

test("accessMatrix lists a module's endpoint under its scoped id", async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints['account-kit/save-profile']).toMatchObject({
    auditor: 'allow',
    none: 'deny',
  });
});

test('accessMatrix lists every page route and every endpoint of the build, with sorted keys', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(Object.keys(matrix)).toEqual(['pages', 'endpoints']);
  // By code unit: an upper case letter sorts before every lower case one.
  expect(Object.keys(matrix.pages)).toEqual([
    'Zebra',
    'dashboard',
    'home',
    'reports',
    'two-factor-enrol',
  ]);
  expect(Object.keys(matrix.endpoints)).toEqual([
    'account-kit/save-profile',
    'audit-login',
    'list-reports',
    'whoami',
  ]);
  Object.values({ ...matrix.pages, ...matrix.endpoints }).forEach((outcomes) => {
    expect(Object.keys(outcomes)).toEqual(['auditor', 'member', 'none', 'unenrolled_auditor']);
  });
});

test('accessMatrix gives the same table, in the same order, from two separately opened apps', async () => {
  const first = await openBuild({ authJson, dataSets, endpoints, routes });
  const second = await openBuild({
    authJson,
    dataSets,
    endpoints: [...endpoints].reverse(),
    routes: [...routes].reverse(),
  });
  expect(JSON.stringify(await second.accessMatrix({ data: 'roles' }))).toEqual(
    JSON.stringify(await first.accessMatrix({ data: 'roles' }))
  );
});

test('accessMatrix reads the users of the data set it is given', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  const matrix = await app.accessMatrix({ data: 'personas' });
  expect(matrix.endpoints['list-reports']).toEqual({ admin: 'deny', none: 'deny' });
});

test('accessMatrix answers for a build with no endpoints', async () => {
  const app = await openBuild({ authJson, dataSets, routes });
  const matrix = await app.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints).toEqual({});
  expect(Object.keys(matrix.pages)).toHaveLength(5);
});

test('accessMatrix refuses a call that names no data set', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  await expect(app.accessMatrix()).rejects.toThrow(
    'accessMatrix requires "data", the name of a data set in tests/data whose users to check. Received undefined.'
  );
});

test('accessMatrix refuses a data set that is not in tests/data, as a journey does', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  await expect(app.accessMatrix({ data: 'missing' })).rejects.toThrow(
    'Data set "missing" not found in tests/data.'
  );
});

test('accessMatrix refuses a call on a closed test app', async () => {
  const app = await openBuild({ authJson, dataSets, endpoints, routes });
  await app.close();
  await expect(app.accessMatrix({ data: 'roles' })).rejects.toThrow(
    'The test app is closed. Open one with openTestApp.'
  );
});

// 200 page routes, a quarter public and the rest gated to one of ten roles, and a data set of 20
// users over those roles.
test('accessMatrix answers 200 pages by 20 users in under a second', async () => {
  const app = await openBuild({
    authJson: { configured: true, pagesProtectedByDefault: true },
    dataSets: {
      scale: {
        users: Object.fromEntries(
          Array.from({ length: 20 }, (_, index) => [
            `user_${index}`,
            { id: `u_${index}`, roles: [`role_${index % 10}`] },
          ])
        ),
      },
    },
    routes: Array.from({ length: 200 }, (_, index) => ({
      pageId: `page_${index}`,
      path: `page_${index}`,
      auth: index % 4 === 0 ? { public: true } : { public: false, roles: [`role_${index % 10}`] },
    })),
  });

  const start = performance.now();
  const matrix = await app.accessMatrix({ data: 'scale' });
  const elapsed = performance.now() - start;

  expect(Object.keys(matrix.pages)).toHaveLength(200);
  Object.values(matrix.pages).forEach((outcomes) => {
    // 20 users and the signed out caller.
    expect(Object.keys(outcomes)).toHaveLength(21);
  });
  expect(matrix.pages.page_0.none).toEqual('allow');
  expect(matrix.pages.page_13).toMatchObject({
    none: 'deny',
    user_2: 'deny',
    user_3: 'allow',
    user_13: 'allow',
  });
  expect(elapsed).toBeLessThan(1000);
});
