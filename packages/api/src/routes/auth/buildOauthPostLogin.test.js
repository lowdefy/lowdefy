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

import { APIError } from 'better-auth/api';

import buildOauthPostLogin, { OAUTH_POST_LOGIN_CONFIRMED } from './buildOauthPostLogin.js';

const baseUrlOrigin = 'https://app.example.com';

test('buildOauthPostLogin redirects to the post-login page on every authorization under the tenant policy', () => {
  const postLogin = buildOauthPostLogin({
    authConfig: {
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth-consent', postLoginPage: '/oauth-select-organization' },
    },
    baseUrlOrigin,
    basePath: '/base',
  });
  expect(postLogin.page).toBe('https://app.example.com/base/oauth-select-organization');
  expect(postLogin.shouldRedirect({ session: { activeOrganizationId: 'org_1' } })).toBe(true);
  expect(postLogin.shouldRedirect({})).toBe(true);
});

test('buildOauthPostLogin skips the redirect on the authorize call that carries the confirmed choice', () => {
  const postLogin = buildOauthPostLogin({
    authConfig: {
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth-consent', postLoginPage: '/oauth-select-organization' },
    },
    baseUrlOrigin,
    basePath: '',
  });
  expect(
    postLogin.shouldRedirect({
      session: { activeOrganizationId: 'org_1', [OAUTH_POST_LOGIN_CONFIRMED]: true },
    })
  ).toBe(false);
});

test('buildOauthPostLogin references the session active organization under the tenant policy', () => {
  const postLogin = buildOauthPostLogin({
    authConfig: {
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth-consent', postLoginPage: '/oauth-select-organization' },
    },
    baseUrlOrigin,
    basePath: '',
  });
  expect(postLogin.consentReferenceId({ session: { activeOrganizationId: 'org_1' } })).toBe(
    'org_1'
  );
});

test('buildOauthPostLogin refuses an authorization with no active organization under the tenant policy', () => {
  const postLogin = buildOauthPostLogin({
    authConfig: {
      organizations: { policy: 'tenant' },
      oauthProvider: { consentPage: '/oauth-consent', postLoginPage: '/oauth-select-organization' },
    },
    baseUrlOrigin,
    basePath: '',
  });
  // better-auth's APIError carries the OAuth error in its body, not its message.
  const expectedBody = {
    error: 'invalid_request',
    error_description:
      'No organization was selected for this authorization. Choose an organization and try again.',
  };
  [{ session: {} }, { session: { activeOrganizationId: '' } }, {}].forEach((input) => {
    let error;
    try {
      postLogin.consentReferenceId(input);
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(APIError);
    expect(error.status).toBe('BAD_REQUEST');
    expect(error.body).toEqual(expectedBody);
  });
});

test('buildOauthPostLogin skips the redirect and references the pinned organization under the pinned policy', () => {
  const postLogin = buildOauthPostLogin({
    authConfig: {
      organizations: { policy: 'pinned', org: 'acme' },
      oauthProvider: { consentPage: '/oauth-consent' },
    },
    baseUrlOrigin,
    basePath: '',
  });
  expect(postLogin.page).toBe('https://app.example.com/oauth-consent');
  expect(postLogin.shouldRedirect({ session: { activeOrganizationId: 'acme' } })).toBe(false);
  expect(postLogin.consentReferenceId({ session: { activeOrganizationId: 'other' } })).toBe('acme');
});
