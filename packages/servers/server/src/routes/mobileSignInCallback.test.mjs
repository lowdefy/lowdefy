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

import { vi, beforeEach, expect, test } from 'vitest';

const authJson = {};

vi.doMock('../../lib/build/auth.js', () => ({ default: authJson }));
vi.doMock('../../lib/build/theme.js', () => ({
  default: { antd: { token: { colorPrimary: '#00aa55' } } },
}));
const { default: mobileSignInCallbackHandler } = await import('./mobileSignInCallback.js');

beforeEach(() => {
  delete authJson.mobile;
});

test('mobileSignInCallbackHandler falls through to the app pages when the app has no mobile section', async () => {
  const next = vi.fn(() => 'page');
  expect(await mobileSignInCallbackHandler({}, next)).toEqual('page');
});

test('mobileSignInCallbackHandler asks the person to return to the app and never echoes the token', async () => {
  authJson.mobile = { shells: [] };
  const next = vi.fn();
  const res = await mobileSignInCallbackHandler(
    { req: { raw: new Request('http://localhost/auth/mobile/callback?token=ott-secret&state=s') } },
    next
  );
  expect(next).not.toHaveBeenCalled();
  expect(res.status).toEqual(200);
  expect(res.headers.get('cache-control')).toEqual('no-store');
  expect(res.headers.get('referrer-policy')).toEqual('no-referrer');
  const html = await res.text();
  expect(html).toContain('Return to the app');
  expect(html).toContain('--primary: #00aa55;');
  expect(html).not.toContain('ott-secret');
});
