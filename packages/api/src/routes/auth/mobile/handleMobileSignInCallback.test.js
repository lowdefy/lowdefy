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
import handleMobileSignInCallback from './handleMobileSignInCallback.js';

test('handleMobileSignInCallback asks the person to return to the app and never shows the token', async () => {
  const response = handleMobileSignInCallback({ primaryColor: '#00aa55' });
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  expect(response.headers.get('x-frame-options')).toBe('DENY');
  const csp = response.headers.get('content-security-policy');
  const nonce = csp.match(/script-src 'nonce-([^']+)'/)[1];
  const html = await response.text();
  expect(html).toContain('<h1>Return to the app</h1>');
  expect(html).not.toContain('token');
  // The token comes off the address bar and history.
  expect(html).toContain(
    `<script nonce="${nonce}">history.replaceState(null, "", location.pathname);</script>`
  );
});

test('handleMobileSignInCallback gives each page its own nonce', () => {
  const first = handleMobileSignInCallback({}).headers.get('content-security-policy');
  const second = handleMobileSignInCallback({}).headers.get('content-security-policy');
  expect(first).not.toBe(second);
});
