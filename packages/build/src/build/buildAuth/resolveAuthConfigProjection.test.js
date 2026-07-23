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

import testContext from '../../test-utils/testContext.js';
import makeRefDefinition from '../buildRefs/makeRefDefinition.js';
import resolveAuthConfigProjection from './resolveAuthConfigProjection.js';

const mockReadConfigFile = jest.fn();

function createTestContext({ lowdefyConfig, files = [] }) {
  const context = testContext({ readConfigFile: mockReadConfigFile });
  context.errors = [];
  context.unresolvedRefVars = {};
  context.lowdefyConfig = lowdefyConfig;
  context.lowdefyYamlRefDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);
  mockReadConfigFile.mockImplementation((filePath) => {
    const file = files.find((f) => f.path === filePath);
    return file ? file.content : null;
  });
  return context;
}

beforeEach(() => {
  mockReadConfigFile.mockReset();
});

test('resolveAuthConfigProjection sets default projection when no auth block', async () => {
  const context = createTestContext({ lowdefyConfig: {} });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toEqual([]);
  expect(context.authConfigProjection).toEqual({
    emailAndPassword: { enabled: false },
    magicLink: { enabled: false },
    twoFactor: { enabled: false },
    passkey: { enabled: false },
    phoneNumber: { enabled: false, signUpOnVerification: false },
    captcha: { enabled: false, provider: null, siteKey: null },
    providers: [],
    roles: [],
    organizations: { signup: 'invite-only' },
  });
});

test('resolveAuthConfigProjection computes projection from an inline auth block', async () => {
  const context = createTestContext({
    lowdefyConfig: {
      auth: {
        emailAndPassword: { enabled: true },
        twoFactor: {},
        providers: [{ id: 'google', type: 'Google', properties: { clientId: 'ci' } }],
        organizations: { policy: 'pinned', signup: 'open' },
      },
    },
  });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toEqual([]);
  expect(context.authConfigProjection).toEqual({
    emailAndPassword: { enabled: true },
    magicLink: { enabled: false },
    twoFactor: { enabled: true },
    passkey: { enabled: false },
    phoneNumber: { enabled: false, signUpOnVerification: false },
    captcha: { enabled: false, provider: null, siteKey: null },
    providers: [{ id: 'google', type: 'Google' }],
    roles: [],
    organizations: { signup: 'open' },
  });
});

test('resolveAuthConfigProjection resolves refs and operators inside the auth block', async () => {
  const context = createTestContext({
    lowdefyConfig: {
      auth: {
        emailAndPassword: { _ref: 'auth/emailAndPassword.yaml' },
        providers: { _ref: 'auth/providers.yaml' },
      },
    },
    files: [
      {
        path: 'auth/emailAndPassword.yaml',
        content: `
enabled:
  _eq:
    - 1
    - 1`,
      },
      {
        path: 'auth/providers.yaml',
        content: `
- id: google
  type: Google
  properties:
    clientSecret: secret-value`,
      },
    ],
  });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toEqual([]);
  expect(context.authConfigProjection.emailAndPassword.enabled).toBe(true);
  expect(context.authConfigProjection.providers).toEqual([{ id: 'google', type: 'Google' }]);
});

test('resolveAuthConfigProjection does not mutate the auth block on lowdefyConfig', async () => {
  const auth = {
    emailAndPassword: { _ref: 'auth/emailAndPassword.yaml' },
  };
  const context = createTestContext({
    lowdefyConfig: { auth },
    files: [{ path: 'auth/emailAndPassword.yaml', content: `enabled: true` }],
  });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toEqual([]);
  expect(auth.emailAndPassword).toEqual({ _ref: 'auth/emailAndPassword.yaml' });
});

test('resolveAuthConfigProjection collects a self-reference error for _build.authConfig inside auth', async () => {
  const context = createTestContext({
    lowdefyConfig: {
      auth: {
        organizations: {
          signup: { '_build.authConfig': 'organizations.signup' },
        },
      },
    },
  });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain(
    '_build.authConfig is not available here.'
  );
});

test('resolveAuthConfigProjection collects a self-reference error for _build.authConfig in refed-in auth content', async () => {
  const context = createTestContext({
    lowdefyConfig: {
      auth: { organizations: { _ref: 'auth/organizations.yaml' } },
    },
    files: [
      {
        path: 'auth/organizations.yaml',
        content: `
signup:
  _build.authConfig: organizations.signup`,
      },
    ],
  });
  await resolveAuthConfigProjection({ context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain(
    '_build.authConfig is not available here.'
  );
});
