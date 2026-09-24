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

import matchOAuthCallback from './matchOAuthCallback.js';

test('matchOAuthCallback returns the lowercase provider key for a built-in social callback', () => {
  expect(matchOAuthCallback('/callback/google')).toEqual({ matched: true, providerKey: 'google' });
});

test('matchOAuthCallback returns the Lowdefy provider id for a genericOAuth callback', () => {
  expect(matchOAuthCallback('/oauth2/callback/my-idp')).toEqual({
    matched: true,
    providerKey: 'my-idp',
  });
});

test('matchOAuthCallback does not read a genericOAuth callback as a social callback for "oauth2"', () => {
  expect(matchOAuthCallback('/oauth2/callback/my-idp').providerKey).not.toBe('oauth2');
});

test('matchOAuthCallback does not match a callback path with no provider segment', () => {
  expect(matchOAuthCallback('/callback/')).toEqual({ matched: false });
  expect(matchOAuthCallback('/oauth2/callback/')).toEqual({ matched: false });
});

test('matchOAuthCallback does not match a callback path with a trailing segment', () => {
  expect(matchOAuthCallback('/callback/google/extra')).toEqual({ matched: false });
  expect(matchOAuthCallback('/oauth2/callback/my-idp/extra')).toEqual({ matched: false });
});

test('matchOAuthCallback does not match the sign-in paths the two-factor plugin already covers', () => {
  expect(matchOAuthCallback('/sign-in/email')).toEqual({ matched: false });
  expect(matchOAuthCallback('/phone-number/verify')).toEqual({ matched: false });
});

test('matchOAuthCallback does not match /magic-link/verify', () => {
  expect(matchOAuthCallback('/magic-link/verify')).toEqual({ matched: false });
});

test('matchOAuthCallback preserves hyphens, underscores and digits in a provider key', () => {
  expect(matchOAuthCallback('/oauth2/callback/acme-idp_v2')).toEqual({
    matched: true,
    providerKey: 'acme-idp_v2',
  });
});
