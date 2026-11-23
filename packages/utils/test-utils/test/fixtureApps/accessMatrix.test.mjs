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

import { afterAll, beforeAll, expect, test } from 'vitest';

import openTestApp from '../../src/openTestApp.js';
import fixtureApps from './fixtureApps.mjs';

const apps = {};
beforeAll(async () => {
  for (const [key, { configDirectory, serverDirectory }] of Object.entries(fixtureApps)) {
    apps[key] = await openTestApp({ configDirectory, serverDirectory });
  }
});

afterAll(async () => {
  await Promise.all(Object.values(apps).map((app) => app.close()));
});

// apps/journey-fixture: every page public, auditor_only gated to the auditor role.

test('accessMatrix allows a public page for every user and for a signed out caller', async () => {
  const matrix = await apps.journeyFixture.accessMatrix({ data: 'roles' });
  expect(matrix.pages.home).toEqual({ auditor: 'allow', member: 'allow', none: 'allow' });
  expect(matrix.pages.ticket).toEqual({ auditor: 'allow', member: 'allow', none: 'allow' });
});

test('accessMatrix allows a role-gated endpoint for its role and denies another role and a signed out caller', async () => {
  const matrix = await apps.journeyFixture.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints.auditor_only).toEqual({ auditor: 'allow', member: 'deny', none: 'deny' });
  expect(matrix.endpoints.notify).toEqual({ auditor: 'allow', member: 'allow', none: 'allow' });
});

test('accessMatrix lists every page route and every endpoint of the build, with sorted keys', async () => {
  const matrix = await apps.journeyFixture.accessMatrix({ data: 'roles' });
  expect(Object.keys(matrix)).toEqual(['pages', 'endpoints']);
  expect(Object.keys(matrix.pages)).toEqual([
    '404',
    'app_errors',
    'app_errors_open',
    'caught_faults',
    'clickable_targets',
    'containing_split',
    'controls',
    'explore',
    'explore_guarded',
    'explore_pr',
    'fill',
    'generated',
    'grid_targets',
    'handoff',
    'home',
    'live_feed',
    'plugin_block',
    'polling',
    'popup_parity',
    'popup_targets',
    'rails',
    'second',
    'selectors',
    'shared_alpha',
    'shared_beta',
    'storage',
    'targets',
    'ticket',
    'timing',
    'walled',
  ]);
  expect(Object.keys(matrix.endpoints)).toEqual([
    'approve_run',
    'auditor_only',
    'caught_operator',
    'caught_webhook',
    'close_runs',
    'detached_log',
    'explode',
    'log_activity',
    'log_payload',
    'notify',
    'payment_events',
    'price_run',
    'rethrown_operator',
    'save_walled',
    'typed_order',
  ]);
  Object.values({ ...matrix.pages, ...matrix.endpoints }).forEach((outcomes) => {
    expect(Object.keys(outcomes)).toEqual(['auditor', 'member', 'none']);
  });
});

test('accessMatrix reads the users of the data set it is given', async () => {
  const matrix = await apps.journeyFixture.accessMatrix({ data: 'personas' });
  expect(matrix.endpoints.auditor_only).toEqual({ admin: 'deny', member: 'deny', none: 'deny' });
});

test('accessMatrix refuses a call that names no data set', async () => {
  await expect(apps.journeyFixture.accessMatrix()).rejects.toThrow(
    'accessMatrix requires "data", the name of a data set in tests/data whose users to check. Received undefined.'
  );
});

test('accessMatrix refuses a data set that is not in tests/data, as a journey does', async () => {
  await expect(apps.journeyFixture.accessMatrix({ data: 'missing' })).rejects.toThrow(
    'Data set "missing" not found in tests/data.'
  );
});

// apps/auth-reference-tenant: pages protected by default, workspace-settings gated to
// workspace-admin.

test('accessMatrix allows a role-gated page for its role and denies another user and a signed out caller', async () => {
  const matrix = await apps.authReferenceTenant.accessMatrix({ data: 'roles' });
  expect(matrix.pages['workspace-settings']).toEqual({
    member: 'deny',
    none: 'deny',
    workspace_admin: 'allow',
  });
});

test('accessMatrix allows a protected page for every signed in user and denies a signed out caller', async () => {
  const matrix = await apps.authReferenceTenant.accessMatrix({ data: 'roles' });
  expect(matrix.pages.dashboard).toEqual({
    member: 'allow',
    none: 'deny',
    workspace_admin: 'allow',
  });
});

test('accessMatrix allows the public pages and endpoints of a protected app for all', async () => {
  const matrix = await apps.authReferenceTenant.accessMatrix({ data: 'roles' });
  expect(matrix.pages.login).toEqual({ member: 'allow', none: 'allow', workspace_admin: 'allow' });
  expect(matrix.pages.home).toEqual({ member: 'allow', none: 'allow', workspace_admin: 'allow' });
  expect(matrix.endpoints.caller).toEqual({
    member: 'allow',
    none: 'allow',
    workspace_admin: 'allow',
  });
});

// apps/auth-reference: a second factor is required (auth.twoFactor.required), and
// two-factor-enrol is the enrolment page.

test('accessMatrix answers enrol_required for an unenrolled user on a page they could otherwise open', async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  expect(matrix.pages['audit-reports']).toEqual({
    admin: 'deny',
    auditor: 'allow',
    none: 'deny',
    unenrolled_auditor: 'enrol_required',
  });
  expect(matrix.pages.dashboard).toEqual({
    admin: 'allow',
    auditor: 'allow',
    none: 'deny',
    unenrolled_auditor: 'enrol_required',
  });
});

test('accessMatrix allows an unenrolled user on the enrolment page', async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  expect(matrix.pages['two-factor-enrol']).toEqual({
    admin: 'allow',
    auditor: 'allow',
    none: 'deny',
    unenrolled_auditor: 'allow',
  });
});

test('accessMatrix denies an unenrolled user a page their roles do not open, rather than asking them to enrol', async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  expect(matrix.pages.admin).toEqual({
    admin: 'allow',
    auditor: 'deny',
    none: 'deny',
    unenrolled_auditor: 'deny',
  });
  expect(matrix.pages.login.unenrolled_auditor).toEqual('allow');
});

test('accessMatrix answers for an endpoint gated by a role pattern', async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  expect(matrix.endpoints['admin-list-users']).toEqual({
    admin: 'allow',
    auditor: 'deny',
    none: 'deny',
    unenrolled_auditor: 'deny',
  });
  expect(matrix.endpoints.whoami).toEqual({
    admin: 'allow',
    auditor: 'allow',
    none: 'allow',
    unenrolled_auditor: 'allow',
  });
});

test('accessMatrix denies every caller an InternalApi endpoint, whatever its auth says', async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  // Built with auth.public true: only the app's own hooks call it.
  expect(matrix.endpoints['audit-login']).toEqual({
    admin: 'deny',
    auditor: 'deny',
    none: 'deny',
    unenrolled_auditor: 'deny',
  });
});

test("accessMatrix lists a module's pages and endpoints under their scoped ids", async () => {
  const matrix = await apps.authReference.accessMatrix({ data: 'roles' });
  expect(matrix.pages['account-kit/login']).toEqual({
    admin: 'allow',
    auditor: 'allow',
    none: 'deny',
    unenrolled_auditor: 'enrol_required',
  });
  expect(Object.keys(matrix.endpoints)).toContain('account-kit/account-audit');
});

test('accessMatrix gives the same table, in the same order, from two separately opened apps', async () => {
  const { configDirectory, serverDirectory } = fixtureApps.authReference;
  const first = await apps.authReference.accessMatrix({ data: 'roles' });
  const again = await openTestApp({ configDirectory, serverDirectory });
  const second = await again.accessMatrix({ data: 'roles' });
  await again.close();
  expect(JSON.stringify(second)).toEqual(JSON.stringify(first));
});
