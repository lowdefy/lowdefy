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

import { AuthenticationError } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import createInjectedApiContext from './createInjectedApiContext.js';
import normalizeInjectedCaller from './normalizeInjectedCaller.js';
import resolveTenancy from '../routes/request/resolveTenancy.js';

// The servers floor an injected caller with normalizeInjectedCaller before they build the
// context; a signed-out caller stays null.
function createTestInjectedContext({ authJson, user }) {
  const context = {
    auth: null,
    buildDirectory: '/build',
    fileCache: new Map(),
    headers: {},
    user: user === null ? null : normalizeInjectedCaller(user),
  };
  createInjectedApiContext(context, { authJson });
  return context;
}

// A scoping-capable connection that declares nothing is walled under policy: tenant.
const walledRequest = {
  connection: { meta: { tenant: true } },
  connectionConfig: {
    id: 'connection:tickets',
    type: 'MongoDBCollection',
    connectionId: 'tickets',
  },
  requestConfig: {
    id: 'request:page:tickets',
    type: 'MongoDBFind',
    requestId: 'tickets',
    connectionId: 'tickets',
  },
};

test('createInjectedApiContext binds the tenant policy from auth.json, with no pinned organization', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'tenant', signup: 'open' } },
    user: { id: 'u_1' },
  });
  expect(context.organization).toEqual({ policy: 'tenant', pinned: null });
});

test('createInjectedApiContext engages the tenant wall, so an injected caller with no organization id is refused', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'tenant' } },
    user: { id: 'u_1', roles: ['admin'] },
  });
  expect(() => resolveTenancy(context, walledRequest)).toThrow(AuthenticationError);
  expect(() => resolveTenancy(context, walledRequest)).toThrow(
    'Request "tickets" reads tenant connection "tickets" but no caller organization resolved.'
  );
});

test('createInjectedApiContext scopes an injected caller that carries an organization id to it', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'tenant' } },
    user: { id: 'u_1', organizationId: 'org_a' },
  });
  expect(resolveTenancy(context, walledRequest)).toEqual({
    tenant: { field: 'organization_id', value: 'org_a' },
    tenantGuard: null,
  });
});

test('createInjectedApiContext binds the pinned policy, under which no connection is walled', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'pinned', org: 'default' } },
    user: { id: 'u_1' },
  });
  expect(context.organization).toEqual({ policy: 'pinned', pinned: null });
  expect(resolveTenancy(context, walledRequest)).toEqual({ tenant: null, tenantGuard: null });
});

test('createInjectedApiContext leaves context.organization null when auth.json declares no organizations', () => {
  const context = createTestInjectedContext({ authJson: {}, user: { id: 'u_1' } });
  expect(context.organization).toBeNull();
  expect(resolveTenancy(context, walledRequest)).toEqual({ tenant: null, tenantGuard: null });
});

test('createInjectedApiContext builds everything createApiContext does', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'tenant' } },
    user: { id: 'u_1', roles: ['admin'] },
  });
  expect(context.authEnforcement).toBeNull();
  expect(context.i18n).toBeUndefined();
  expect(context.readConfigFile).toBeInstanceOf(Function);
  expect(context.authorizeOutcome({ auth: { public: false, roles: ['admin'] } })).toEqual('allow');
  expect(context.authorizeOutcome({ auth: { public: false, roles: ['finance'] } })).toEqual('deny');
});

test('createInjectedApiContext denies a signed-out caller a protected resource', () => {
  const context = createTestInjectedContext({
    authJson: { organizations: { policy: 'tenant' } },
    user: null,
  });
  expect(context.authorizeOutcome({ auth: { public: false } })).toEqual('deny');
  expect(context.authorizeOutcome({ auth: { public: true } })).toEqual('allow');
});
