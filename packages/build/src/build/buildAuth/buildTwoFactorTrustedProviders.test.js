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

import buildTwoFactorTrustedProviders from './buildTwoFactorTrustedProviders.js';

test('buildTwoFactorTrustedProviders translates a built-in provider to its lowercased type, not its id', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [{ id: 'google-sso', type: 'Google', twoFactorTrusted: true }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual(['google']);
});

test('buildTwoFactorTrustedProviders translates a GenericOAuth provider to its id', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [{ id: 'my-idp', type: 'GenericOAuth', twoFactorTrusted: true }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual(['my-idp']);
});

test('buildTwoFactorTrustedProviders includes only flagged providers, in auth.providers order', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [
        { id: 'google-sso', type: 'Google', twoFactorTrusted: true },
        { id: 'okta', type: 'GenericOAuth' },
        { id: 'my-idp', type: 'GenericOAuth', twoFactorTrusted: true },
        { id: 'github-sso', type: 'GitHub' },
      ],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual(['google', 'my-idp']);
});

test('buildTwoFactorTrustedProviders assigns an empty array when no provider is flagged', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [{ id: 'okta', type: 'GenericOAuth' }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual([]);
});

test('buildTwoFactorTrustedProviders assigns an empty array when there are no providers', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual([]);
});

test('buildTwoFactorTrustedProviders is a no-op when twoFactor.enabled is false', () => {
  const components = {
    auth: {
      twoFactor: { enabled: false },
      providers: [{ id: 'google-sso', type: 'Google', twoFactorTrusted: true }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toBeUndefined();
});

test('buildTwoFactorTrustedProviders is a no-op when there is no twoFactor block', () => {
  const components = {
    auth: {
      providers: [{ id: 'google-sso', type: 'Google', twoFactorTrusted: true }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor?.mfaTrustedProviderKeys).toBeUndefined();
});

test('buildTwoFactorTrustedProviders excludes a provider with twoFactorTrusted explicitly false', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [{ id: 'google-sso', type: 'Google', twoFactorTrusted: false }],
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual([]);
});

test('buildTwoFactorTrustedProviders ignores account.accountLinking.trustedProviders - the two lists are independent', () => {
  const components = {
    auth: {
      twoFactor: { enabled: true },
      providers: [{ id: 'google-sso', type: 'Google' }],
      account: {
        accountLinking: {
          trustedProviders: ['google-sso'],
        },
      },
    },
  };
  const res = buildTwoFactorTrustedProviders({ components });
  expect(res.auth.twoFactor.mfaTrustedProviderKeys).toEqual([]);
});
