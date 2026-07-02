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

import buildTrustedProviders from './buildTrustedProviders.js';

test('buildTrustedProviders returns components unchanged when account is absent', () => {
  const components = {
    auth: {
      providers: [],
    },
  };
  const res = buildTrustedProviders({ components });
  expect(res).toEqual({
    auth: {
      providers: [],
    },
  });
});

test('buildTrustedProviders returns components unchanged when trustedProviders is not an array', () => {
  const components = {
    auth: {
      providers: [],
      account: {
        accountLinking: {
          enabled: true,
        },
      },
    },
  };
  const res = buildTrustedProviders({ components });
  expect(res.auth.account.accountLinking.trustedProviders).toBeUndefined();
});

test('buildTrustedProviders translates "emailAndPassword" to "email-password"', () => {
  const components = {
    auth: {
      providers: [],
      account: {
        accountLinking: {
          trustedProviders: ['emailAndPassword'],
        },
      },
    },
  };
  const res = buildTrustedProviders({ components });
  expect(res.auth.account.accountLinking.trustedProviders).toEqual(['email-password']);
});

test('buildTrustedProviders translates a GenericOAuth provider id to itself', () => {
  const components = {
    auth: {
      providers: [{ id: 'okta', type: 'GenericOAuth', properties: {} }],
      account: {
        accountLinking: {
          trustedProviders: ['okta'],
        },
      },
    },
  };
  const res = buildTrustedProviders({ components });
  expect(res.auth.account.accountLinking.trustedProviders).toEqual(['okta']);
});

test('buildTrustedProviders translates a built-in provider id to its lowercased type', () => {
  const components = {
    auth: {
      providers: [{ id: 'google', type: 'Google', properties: {} }],
      account: {
        accountLinking: {
          trustedProviders: ['google'],
        },
      },
    },
  };
  const res = buildTrustedProviders({ components });
  expect(res.auth.account.accountLinking.trustedProviders).toEqual(['google']);
});

test('buildTrustedProviders throws when trustedProviders references an unknown provider id', () => {
  const components = {
    auth: {
      providers: [],
      account: {
        accountLinking: {
          trustedProviders: ['unknown-id'],
        },
      },
    },
  };
  expect(() => buildTrustedProviders({ components })).toThrow(
    'Auth "account.accountLinking.trustedProviders" references unknown provider id "unknown-id". List the "id" of a provider configured in "auth.providers", or the literal "emailAndPassword".'
  );
});
