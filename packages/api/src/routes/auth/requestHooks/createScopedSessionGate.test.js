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

import { matchesScopedSessionGate } from './createScopedSessionGate.js';

const request = new Request('https://app.example.com/api/auth/x');

test.each([
  '/sign-in/email',
  '/sign-in/magic-link',
  '/magic-link/verify',
  '/email-otp/send-verification-otp',
  '/email-otp/request-password-reset',
  '/email-otp/reset-password',
  '/forget-password/email-otp',
  '/phone-number/send-otp',
  '/phone-number/request-password-reset',
  '/phone-number/reset-password',
  '/get-session',
  '/sign-out',
])('a scoped session may call the ordinary sign-in or session route %s', (path) => {
  expect(matchesScopedSessionGate(path, { request })).toBe(false);
});

test('a scoped session may sign in by phone, but not put a number on its own user', () => {
  expect(matchesScopedSessionGate('/phone-number/verify', { request, body: {} })).toBe(false);
  expect(
    matchesScopedSessionGate('/phone-number/verify', {
      request,
      body: { updatePhoneNumber: true },
    })
  ).toBe(true);
});

test.each([
  '/change-password',
  '/passkey/generate-register-options',
  '/two-factor/enable',
  '/organization/set-active',
])('the gate claims the session-bound route %s', (path) => {
  expect(matchesScopedSessionGate(path, { request })).toBe(true);
});

test('the gate leaves a server-side call with no request alone', () => {
  expect(matchesScopedSessionGate('/change-password', {})).toBe(false);
});
