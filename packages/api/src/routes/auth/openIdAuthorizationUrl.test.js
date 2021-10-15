/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { Issuer } from 'openid-client';
import openIdAuthorizationUrl from './openIdAuthorizationUrl';
import testContext from '../../test/testContext';
import setAuthenticationCookie from './setAuthenticationCookie';
import { ConfigurationError } from '../../context/errors';

jest.mock('./setAuthenticationCookie');
jest.mock('openid-client');

const mockOpenIdAuthorizationUrl = jest.fn(
  // eslint-disable-next-line camelcase
  ({ redirect_uri, response_type, scope, state, ...additional }) =>
    `${redirect_uri}:${response_type}:${scope}:${state}:${JSON.stringify(additional)}`
);

const mockClient = jest.fn(() => ({
  authorizationUrl: mockOpenIdAuthorizationUrl,
}));

// eslint-disable-next-line no-undef
Issuer.discover = jest.fn(() => ({
  Client: mockClient,
}));

const authorizationUrlInput = { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } };

const secrets = {
  OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
  OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
  OPENID_DOMAIN: 'OPENID_DOMAIN',
  JWT_SECRET: 'JWT_SECRET',
};

const RealDate = Date.now;
const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);
global.Date.now = mockNow;

beforeEach(() => {
  setAuthenticationCookie.mockReset();
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('authorizationUrl, no openId config', async () => {
  const context = testContext();
  await expect(openIdAuthorizationUrl(context, authorizationUrlInput)).rejects.toThrow(
    'Invalid OpenID Connect configuration.'
  );
});

test('authorizationUrl, no optional config', async () => {
  const context = testContext({ secrets });
  const url = await openIdAuthorizationUrl(context, authorizationUrlInput);
  expect(mockClient.mock.calls).toEqual([
    [
      {
        client_id: 'OPENID_CLIENT_ID',
        client_secret: 'OPENID_CLIENT_SECRET',
        redirect_uris: ['https://host/auth/openid-callback'],
      },
    ],
  ]);
  expect(url).toEqual(
    'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI:{}'
  );
});

test('authorizationUrl, set scope', async () => {
  const context = testContext({
    secrets,
    config: {
      auth: {
        openId: {
          scope: 'custom scope',
        },
      },
    },
  });
  const url = await openIdAuthorizationUrl(context, authorizationUrlInput);
  expect(url).toEqual(
    'https://host/auth/openid-callback:code:custom scope:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI:{}'
  );
});

test('authorizationUrl, jwt config error', async () => {
  const context = testContext({
    secrets: {
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    },
  });

  await expect(openIdAuthorizationUrl(context, authorizationUrlInput)).rejects.toThrow(
    ConfigurationError
  );
});

test('authorizationUrl, additional query params', async () => {
  const context = testContext({ secrets });
  const url = await openIdAuthorizationUrl(context, {
    authUrlQueryParams: { screen_hint: 'sign-up' },
  });

  expect(mockClient.mock.calls).toEqual([
    [
      {
        client_id: 'OPENID_CLIENT_ID',
        client_secret: 'OPENID_CLIENT_SECRET',
        redirect_uris: ['https://host/auth/openid-callback'],
      },
    ],
  ]);
  expect(url).toEqual(
    'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb3dkZWZ5X29wZW5pZF9zdGF0ZV90b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjMwMSwiYXVkIjoiaG9zdCIsImlzcyI6Imhvc3QifQ.-UtxdTFvQW6pFFFHTO0EtmubPbkDl8EJQwBQA2pp_M4:{"screen_hint":"sign-up"}'
  );
});

test('authorizationUrl, additional query do not overwrite fixed params', async () => {
  const context = testContext({ secrets });
  const url = await openIdAuthorizationUrl(context, {
    authorizationUrlInput: {
      authUrlQueryParams: {
        redirect_uri: 'overwritten',
        response_type: 'overwritten',
        scope: 'overwritten',
        state: 'overwritten',
      },
    },
  });
  expect(mockClient.mock.calls).toEqual([
    [
      {
        client_id: 'OPENID_CLIENT_ID',
        client_secret: 'OPENID_CLIENT_SECRET',
        redirect_uris: ['https://host/auth/openid-callback'],
      },
    ],
  ]);
  expect(url).toEqual(
    'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb3dkZWZ5X29wZW5pZF9zdGF0ZV90b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjMwMSwiYXVkIjoiaG9zdCIsImlzcyI6Imhvc3QifQ.-UtxdTFvQW6pFFFHTO0EtmubPbkDl8EJQwBQA2pp_M4:{}'
  );
});
