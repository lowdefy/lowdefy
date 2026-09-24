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

import buildCaptchaPlugin from './buildCaptchaPlugin.js';

function createAuthConfig({ captcha = {}, ...rest } = {}) {
  return {
    captcha: {
      enabled: true,
      provider: 'cloudflare-turnstile',
      siteKey: '0x4AAAAAAA',
      secretKey: 'resolved-secret-key',
      ...captcha,
    },
    ...rest,
  };
}

test('buildCaptchaPlugin returns the captcha plugin with provider and secretKey', () => {
  const plugin = buildCaptchaPlugin({ authConfig: createAuthConfig() });
  expect(plugin.id).toBe('captcha');
  expect(plugin.options.provider).toBe('cloudflare-turnstile');
  expect(plugin.options.secretKey).toBe('resolved-secret-key');
});

test('buildCaptchaPlugin throws ConfigError when secretKey does not resolve to a string', () => {
  expect(() =>
    buildCaptchaPlugin({
      authConfig: createAuthConfig({ captcha: { secretKey: { _secret: 'MISSING' } } }),
    })
  ).toThrow(
    'Auth "captcha.secretKey" did not resolve to a string. Check the _secret operator reference and that the secret is set.'
  );
});

test('buildCaptchaPlugin computes the always-protected endpoints for an email-only app', () => {
  const plugin = buildCaptchaPlugin({
    authConfig: createAuthConfig({ emailAndPassword: { enabled: true } }),
  });
  expect(plugin.options.endpoints).toEqual([
    '/sign-up/email',
    '/sign-in/email',
    '/request-password-reset',
    '/send-verification-email',
  ]);
});

test('buildCaptchaPlugin adds the magic-link initiate endpoint when magicLink is enabled', () => {
  const plugin = buildCaptchaPlugin({
    authConfig: createAuthConfig({ magicLink: { enabled: true } }),
  });
  expect(plugin.options.endpoints).toContain('/sign-in/magic-link');
});

test('buildCaptchaPlugin adds the phone initiate endpoints when phoneNumber is enabled', () => {
  const plugin = buildCaptchaPlugin({
    authConfig: createAuthConfig({ phoneNumber: { enabled: true } }),
  });
  expect(plugin.options.endpoints).toEqual(
    expect.arrayContaining([
      '/phone-number/send-otp',
      '/sign-in/phone-number',
      '/phone-number/request-password-reset',
    ])
  );
  // Verify/consume endpoints ride their own single-use codes - covering them
  // would demand a second captcha token per flow.
  expect(plugin.options.endpoints).not.toContain('/phone-number/verify');
  expect(plugin.options.endpoints).not.toContain('/phone-number/reset-password');
});

test('buildCaptchaPlugin does not add method endpoints for disabled methods', () => {
  const plugin = buildCaptchaPlugin({
    authConfig: createAuthConfig({
      magicLink: { enabled: false },
      phoneNumber: { enabled: false },
    }),
  });
  expect(plugin.options.endpoints).not.toContain('/sign-in/magic-link');
  expect(plugin.options.endpoints).not.toContain('/phone-number/send-otp');
});

test('buildCaptchaPlugin lets an explicit endpoints list replace the computed set', () => {
  const plugin = buildCaptchaPlugin({
    authConfig: createAuthConfig({
      captcha: { endpoints: ['/sign-up/email'] },
      phoneNumber: { enabled: true },
    }),
  });
  expect(plugin.options.endpoints).toEqual(['/sign-up/email']);
});
