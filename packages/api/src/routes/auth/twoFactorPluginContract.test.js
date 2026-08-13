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

// Drift detectors for the engine's two-factor challenge interception in
// routes/auth/requestHooks/. BetterAuth's two-factor plugin only begins a
// challenge from its own after-hook, and that hook's matcher only covers
// /sign-in/email, /sign-in/username and /sign-in/phone-number - magic link,
// OAuth and SMS sign-ins walk straight past an enrolled user's second
// factor (https://github.com/better-auth/better-auth/issues/10322). The
// interception reimplements the hook's private internals (verification
// identifiers, cookie names, the attempts record) because BetterAuth
// exposes no `beginTwoFactorChallenge` helper. Nothing here asserts the
// interception itself - these assertions pin the upstream contract it
// copies, so that if the contract moves, this file fails instead of the
// interception silently starting to lie about having MFA. When upstream
// lands the matcher extension or a public helper for this, delete the
// interception and this file together.

import { twoFactor, TWO_FACTOR_ERROR_CODES } from 'better-auth/plugins/two-factor';

test('twoFactor plugin sign-in matcher only covers email, username and phone-number', () => {
  const plugin = twoFactor();

  // The shape the engine's hook relies on to reach the matcher at all. If
  // upstream adds a second `after` hook, `[0]` may no longer be the
  // sign-in matcher and this assertion catches that before the path
  // checks below give a false sense of safety.
  expect(plugin.hooks.after).toHaveLength(1);
  expect(typeof plugin.hooks.after[0].matcher).toBe('function');

  const matcher = plugin.hooks.after[0].matcher;

  // The defect itself: the plugin's own hook fires for these paths, so a
  // second factor is enforced on credential sign-in without the engine's
  // help.
  expect(matcher({ path: '/sign-in/email' })).toBe(true);
  expect(matcher({ path: '/sign-in/phone-number' })).toBe(true);

  // These are the four paths the engine hooks precisely because the
  // plugin's matcher does not cover them - magic link, OAuth and phone
  // OTP verification all complete a sign-in without ever triggering a 2FA
  // challenge. If upstream extends the matcher to any of these, this
  // assertion turns red the moment the engine's hook becomes redundant or
  // starts double-firing for that path. On failure, delete the matching
  // branch of the engine hook - do not update this expectation to keep it
  // passing.
  expect(matcher({ path: '/magic-link/verify' })).toBe(false);
  expect(matcher({ path: '/callback/google' })).toBe(false);
  expect(matcher({ path: '/oauth2/callback/my-idp' })).toBe(false);
  expect(matcher({ path: '/phone-number/verify' })).toBe(false);
});

test('twoFactor plugin version matches the pinned better-auth dependency', () => {
  // Pinned in packages/api/package.json as "better-auth": "1.6.23". This is
  // the assertion that catches drift nothing else here can see: the
  // `2fa-`/`2fa-attempts-` identifier prefixes are inline template
  // literals with no exported constant, and TWO_FACTOR_COOKIE_NAME /
  // TRUST_DEVICE_COOKIE_NAME live in a module no public export path
  // reaches. A rename to any of those would leave the matcher test above
  // green while every correct code the interception issues is rejected at
  // sign-in. This assertion over-fires by design - an unrelated patch
  // release trips it too - because that is the only failure mode
  // available for internals this deeply private. On failure, re-read
  // requestHooks/beginTwoFactorChallenge.js against the new plugin
  // source before touching the string.
  expect(twoFactor().version).toBe('1.6.23');
});

test('allowPasswordless relaxes the enable-two-factor body, required without it', () => {
  // getBetterAuthConfig instantiates twoFactor({ allowPasswordless: true }) so
  // shouldRequirePassword waives the password for a credential-less caller
  // (false), while still requiring it for one holding a password credential
  // (true). That waiver is closure-private, but at 1.6.23 the flag also relaxes
  // the enable endpoint's body schema - password becomes optional - which is the
  // one publicly observable proxy for it. If upstream decouples the schema from
  // the flag or drops the waiver, this fails; re-read shouldRequirePassword
  // (utils/password.mjs) and the enableTwoFactor body against the new source.
  expect(
    twoFactor({ allowPasswordless: true }).endpoints.enableTwoFactor.options.body.safeParse({})
      .success
  ).toBe(true);
  expect(twoFactor().endpoints.enableTwoFactor.options.body.safeParse({}).success).toBe(false);
});

test('twoFactor plugin stores trustDeviceMaxAge on options, and honours 0', () => {
  // The trustDevice: false disable in getBetterAuthConfig passes
  // trustDeviceMaxAge: 0, and verify-two-factor.mjs reads it back as
  // getPlugin('two-factor').options?.trustDeviceMaxAge ?? 2592e3 - nullish, so 0
  // is honoured rather than falling back to the 30-day default. This pins that
  // the option round-trips onto `.options` as the endpoint reads it; if upstream
  // stops storing it there, or switches the read to `|| 2592e3` (making 0 fall
  // back to 30 days), the disable silently stops working. On failure, re-read
  // verify-two-factor.mjs and index.mjs against the new source before touching
  // getBetterAuthConfig's trustDeviceMaxAge wiring.
  expect(twoFactor({ trustDeviceMaxAge: 0 }).options.trustDeviceMaxAge).toBe(0);
});

test('twoFactor plugin exposes an object error code for a missing attempts record', () => {
  // This is the code beginAttempt (verify-two-factor.mjs) throws when the
  // `2fa-attempts-{identifier}` verification record is absent. The
  // engine's interception creates that record for exactly this reason -
  // without it, the first real verification attempt made through the
  // plugin's own endpoint would reject a legitimate code. At 1.6.23 the
  // value is an object ({ code, message, toString }), not a bare string,
  // so both existence and `.code` are asserted rather than accepting a
  // truthy check that a change to a plain string would also satisfy. If
  // this code disappears or the attempts mechanism changes shape, re-read
  // the interception's step 4 (creating the `2fa-attempts-` record)
  // against the new source.
  expect(TWO_FACTOR_ERROR_CODES.INVALID_TWO_FACTOR_COOKIE).toBeDefined();
  expect(TWO_FACTOR_ERROR_CODES.INVALID_TWO_FACTOR_COOKIE.code).toBe('INVALID_TWO_FACTOR_COOKIE');
});
