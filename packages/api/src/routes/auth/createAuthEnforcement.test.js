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

import { expect, test } from 'vitest';

import createAuthEnforcement from './createAuthEnforcement.js';

test('createAuthEnforcement maps the three facts from auth.json', () => {
  expect(
    createAuthEnforcement({
      authJson: {
        twoFactor: { required: true },
        authPages: { twoFactorEnrol: '/two-factor-enrol' },
        pagesProtectedByDefault: true,
      },
    })
  ).toEqual({
    pagesProtectedByDefault: true,
    twoFactorEnrolPageId: 'two-factor-enrol',
    twoFactorRequired: true,
  });
});

test('createAuthEnforcement floors every fact when auth.json sets none of them', () => {
  expect(createAuthEnforcement({ authJson: {} })).toEqual({
    pagesProtectedByDefault: false,
    twoFactorEnrolPageId: null,
    twoFactorRequired: false,
  });
});

test('createAuthEnforcement requires enrolment only when twoFactor.required is exactly true', () => {
  expect(
    createAuthEnforcement({ authJson: { twoFactor: { enabled: true } } }).twoFactorRequired
  ).toBe(false);
  expect(
    createAuthEnforcement({ authJson: { twoFactor: { required: 'true' } } }).twoFactorRequired
  ).toBe(false);
});

test('createAuthEnforcement gives the enrolment page as a page id, with or without a leading slash', () => {
  expect(
    createAuthEnforcement({ authJson: { authPages: { twoFactorEnrol: '/account/enrol' } } })
      .twoFactorEnrolPageId
  ).toBe('account/enrol');
  expect(
    createAuthEnforcement({ authJson: { authPages: { twoFactorEnrol: 'account/enrol' } } })
      .twoFactorEnrolPageId
  ).toBe('account/enrol');
});
