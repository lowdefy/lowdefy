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

import getAuthEnforcement, { registerAuthEnforcement } from './getAuthEnforcement.js';

test('getAuthEnforcement returns null when auth is null', () => {
  expect(getAuthEnforcement({ auth: null })).toBeNull();
});

test('getAuthEnforcement returns null when auth is undefined', () => {
  expect(getAuthEnforcement({ auth: undefined })).toBeNull();
});

test('getAuthEnforcement returns null for an auth instance that was never registered', () => {
  const auth = {};
  expect(getAuthEnforcement({ auth })).toBeNull();
});

test('getAuthEnforcement reads back the registered enforcement facts', () => {
  const auth = {};
  registerAuthEnforcement({
    auth,
    authJson: {
      twoFactor: { required: true },
      authPages: { twoFactorEnrol: '/two-factor-enrol' },
      pagesProtectedByDefault: true,
    },
  });

  expect(getAuthEnforcement({ auth })).toEqual({
    pagesProtectedByDefault: true,
    twoFactorEnrolPageId: 'two-factor-enrol',
    twoFactorRequired: true,
  });
});

test('getAuthEnforcement floors every field when none of the three keys are present', () => {
  const auth = {};
  registerAuthEnforcement({ auth, authJson: {} });

  expect(getAuthEnforcement({ auth })).toEqual({
    pagesProtectedByDefault: false,
    twoFactorEnrolPageId: null,
    twoFactorRequired: false,
  });
});

test('getAuthEnforcement strips the leading slash from the enrolment page path', () => {
  const withSlash = {};
  registerAuthEnforcement({
    auth: withSlash,
    authJson: { authPages: { twoFactorEnrol: '/account/enrol' } },
  });
  expect(getAuthEnforcement({ auth: withSlash }).twoFactorEnrolPageId).toBe('account/enrol');

  const withoutSlash = {};
  registerAuthEnforcement({
    auth: withoutSlash,
    authJson: { authPages: { twoFactorEnrol: 'account/enrol' } },
  });
  expect(getAuthEnforcement({ auth: withoutSlash }).twoFactorEnrolPageId).toBe('account/enrol');
});
