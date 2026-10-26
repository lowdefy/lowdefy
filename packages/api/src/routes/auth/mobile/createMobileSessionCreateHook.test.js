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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import createMobileSessionCreateHook from './createMobileSessionCreateHook.js';

const NOW = new Date('2026-10-18T00:00:00Z').getTime();

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const session = { userId: 'user_1', expiresAt: new Date(NOW + 1000), token: 'tok' };

function ctxFor(headers) {
  return {
    request: new Request('http://localhost/api/auth/sign-in/email-otp', {
      headers: { 'x-lowdefy-shell': '7.1.0', ...headers },
    }),
  };
}

test('a session created by a native sign-in is marked mobile with the phone lifetime', async () => {
  const hook = createMobileSessionCreateHook({ sessionExpiresIn: 2592000 });
  expect(await hook(session, ctxFor({}))).toEqual({
    data: { ...session, mobile: true, expiresAt: new Date(NOW + 2592000 * 1000) },
  });
});

test('a session created by a browser is left alone', async () => {
  const hook = createMobileSessionCreateHook({ sessionExpiresIn: 2592000 });
  expect(await hook(session, ctxFor({ origin: 'http://localhost' }))).toBeUndefined();
});

test('a session created with no request is left alone', async () => {
  const hook = createMobileSessionCreateHook({ sessionExpiresIn: 2592000 });
  expect(await hook(session, null)).toBeUndefined();
});
