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

import computeAuthConfigProjection from './computeAuthConfigProjection.js';

test('computeAuthConfigProjection returns all defaults when auth is not configured', () => {
  expect(computeAuthConfigProjection()).toEqual({
    emailAndPassword: { enabled: false },
    magicLink: { enabled: false },
    twoFactor: { enabled: false },
    passkey: { enabled: false },
    phoneNumber: { enabled: false, signUpOnVerification: false },
    captcha: { enabled: false, provider: null, siteKey: null },
    providers: [],
    organizations: { signup: 'invite-only' },
    roles: [],
  });
});

test('computeAuthConfigProjection reflects explicit enabled flags', () => {
  const projection = computeAuthConfigProjection({
    emailAndPassword: { enabled: true },
    magicLink: { enabled: true },
  });
  expect(projection.emailAndPassword.enabled).toBe(true);
  expect(projection.magicLink.enabled).toBe(true);
  expect(projection.twoFactor.enabled).toBe(false);
  expect(projection.passkey.enabled).toBe(false);
});

test('computeAuthConfigProjection treats emailAndPassword enabled false as disabled', () => {
  const projection = computeAuthConfigProjection({
    emailAndPassword: { enabled: false },
  });
  expect(projection.emailAndPassword.enabled).toBe(false);
});

test('computeAuthConfigProjection presence of twoFactor and passkey blocks implies enabled', () => {
  const projection = computeAuthConfigProjection({
    twoFactor: {},
    passkey: { rpId: 'example.com' },
  });
  expect(projection.twoFactor.enabled).toBe(true);
  expect(projection.passkey.enabled).toBe(true);
});

test('computeAuthConfigProjection respects explicit twoFactor and passkey enabled false', () => {
  const projection = computeAuthConfigProjection({
    twoFactor: { enabled: false },
    passkey: { enabled: false },
  });
  expect(projection.twoFactor.enabled).toBe(false);
  expect(projection.passkey.enabled).toBe(false);
});

test('computeAuthConfigProjection projects providers to id and type only', () => {
  const projection = computeAuthConfigProjection({
    providers: [
      {
        id: 'google',
        type: 'Google',
        properties: { clientId: 'client-id', clientSecret: 'client-secret' },
      },
    ],
  });
  expect(projection.providers).toEqual([{ id: 'google', type: 'Google' }]);
});

test('computeAuthConfigProjection organizations signup defaults to invite-only under pinned', () => {
  expect(computeAuthConfigProjection({ organizations: {} }).organizations.signup).toBe(
    'invite-only'
  );
  expect(
    computeAuthConfigProjection({ organizations: { policy: 'pinned' } }).organizations.signup
  ).toBe('invite-only');
});

test('computeAuthConfigProjection organizations signup is open under tenant policy', () => {
  expect(
    computeAuthConfigProjection({ organizations: { policy: 'tenant' } }).organizations.signup
  ).toBe('open');
});

test('computeAuthConfigProjection explicit organizations signup wins', () => {
  expect(
    computeAuthConfigProjection({ organizations: { signup: 'open' } }).organizations.signup
  ).toBe('open');
});

test('computeAuthConfigProjection reflects phoneNumber enabled and signUpOnVerification presence', () => {
  const projection = computeAuthConfigProjection({
    phoneNumber: {
      enabled: true,
      signUpOnVerification: { tempEmailDomain: 'phone.example.com' },
    },
  });
  expect(projection.phoneNumber).toEqual({ enabled: true, signUpOnVerification: true });
});

test('computeAuthConfigProjection projects signUpOnVerification as a boolean, never the domain', () => {
  const projection = computeAuthConfigProjection({
    phoneNumber: { enabled: true },
  });
  expect(projection.phoneNumber).toEqual({ enabled: true, signUpOnVerification: false });
});

test('computeAuthConfigProjection treats phoneNumber enabled false as disabled', () => {
  const projection = computeAuthConfigProjection({
    phoneNumber: { enabled: false },
  });
  expect(projection.phoneNumber.enabled).toBe(false);
});

test('computeAuthConfigProjection projects captcha enabled, provider and siteKey - never secretKey', () => {
  const projection = computeAuthConfigProjection({
    captcha: {
      enabled: true,
      provider: 'cloudflare-turnstile',
      siteKey: '0x4AAAAAAA',
      secretKey: { _secret: 'TURNSTILE_SECRET_KEY' },
    },
  });
  expect(projection.captcha).toEqual({
    enabled: true,
    provider: 'cloudflare-turnstile',
    siteKey: '0x4AAAAAAA',
  });
});

test('computeAuthConfigProjection returns disabled captcha defaults when absent', () => {
  expect(computeAuthConfigProjection({}).captcha).toEqual({
    enabled: false,
    provider: null,
    siteKey: null,
  });
});

test('computeAuthConfigProjection projects roles as id, label and description', () => {
  const projection = computeAuthConfigProjection({
    roles: [
      { id: 'admin', label: 'Administrator', description: 'Full access' },
      { id: 'editor', label: 'Editor', description: 'Can edit content' },
    ],
  });
  expect(projection.roles).toEqual([
    { id: 'admin', label: 'Administrator', description: 'Full access' },
    { id: 'editor', label: 'Editor', description: 'Can edit content' },
  ]);
});

test('computeAuthConfigProjection defaults role label to id when label is omitted', () => {
  const projection = computeAuthConfigProjection({
    roles: [{ id: 'admin', description: 'Full access' }],
  });
  expect(projection.roles).toEqual([
    { id: 'admin', label: 'admin', description: 'Full access' },
  ]);
});

test('computeAuthConfigProjection returns empty roles when source roles are absent', () => {
  expect(computeAuthConfigProjection({}).roles).toEqual([]);
});
