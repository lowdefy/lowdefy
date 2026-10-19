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

import createApiContext from './createApiContext.js';
import { registerAuthEnforcement } from '../routes/auth/getAuthEnforcement.js';

function createTestApiContext(overrides = {}) {
  const context = {
    buildDirectory: '/build',
    fileCache: new Map(),
    headers: {},
    user: null,
    ...overrides,
  };
  createApiContext(context);
  return context;
}

test('createApiContext sets authEnforcement from the retained record for the request auth', () => {
  const auth = { api: {} };
  registerAuthEnforcement({
    auth,
    authJson: {
      twoFactor: { required: true },
      authPages: { twoFactorEnrol: '/two-factor-enrol' },
      pagesProtectedByDefault: true,
    },
  });
  const context = createTestApiContext({ auth });
  expect(context.authEnforcement).toEqual({
    pagesProtectedByDefault: true,
    twoFactorEnrolPageId: 'two-factor-enrol',
    twoFactorRequired: true,
  });
});

test('createApiContext sets authEnforcement to null when auth is absent', () => {
  const context = createTestApiContext({ auth: undefined });
  expect(context.authEnforcement).toBeNull();
});
