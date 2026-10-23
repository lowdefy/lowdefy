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
import buildBearerPlugin from './buildBearerPlugin.js';

function ctxFor(headers) {
  const responseHeaders = new Headers({
    'set-cookie': 'better-auth.session_token=tok.sig; Path=/',
  });
  return {
    request: new Request('http://localhost/api/auth/sign-in/email-otp', { headers }),
    context: { responseHeaders },
  };
}

test('buildBearerPlugin is the bearer plugin requiring a signed token', () => {
  const plugin = buildBearerPlugin();
  expect(plugin.id).toBe('bearer');
  expect(plugin.options).toEqual({ requireSignature: true });
  expect(plugin.hooks.before).toHaveLength(1);
});

test('buildBearerPlugin sends the session token header to a native request', () => {
  const [hook] = buildBearerPlugin().hooks.after;
  expect(hook.matcher(ctxFor({}))).toBe(true);
});

test('buildBearerPlugin never sends the session token header to a browser', () => {
  const [hook] = buildBearerPlugin().hooks.after;
  expect(hook.matcher(ctxFor({ origin: 'http://localhost' }))).toBe(false);
  expect(hook.matcher(ctxFor({ cookie: 'better-auth.session_token=tok.sig' }))).toBe(false);
});
