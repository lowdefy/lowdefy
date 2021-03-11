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

// eslint-disable-next-line no-unused-vars
import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';
import { Issuer } from 'openid-client';

import openIdAuthorizationUrl from './openIdAuthorizationUrl';

jest.mock('openid-client');

const openIdAuthorizationUrlInput = { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } };

// Controller mocks
const mockAuthorizationUrl = jest.fn((params) => params);
const getController = jest.fn((name) => {
  if (name === 'openId') {
    return {
      authorizationUrl: mockAuthorizationUrl,
    };
  }
});

// OpenID mocks
const mockOpenIdAuthorizationUrl = jest.fn(
  // eslint-disable-next-line camelcase
  ({ redirect_uri, response_type, scope, state }) =>
    `${redirect_uri}:${response_type}:${scope}:${state}`
);

const mockClient = jest.fn(() => ({
  authorizationUrl: mockOpenIdAuthorizationUrl,
}));

Issuer.discover = jest.fn(() => ({
  Client: mockClient,
}));

const secrets = {
  OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
  OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
  OPENID_DOMAIN: 'OPENID_DOMAIN',
  JWT_SECRET: 'JWT_SECRET',
};

const loaders = {
  component: {
    load: jest.fn(),
  },
};

const getSecrets = jest.fn(() => secrets);

const RealDate = Date.now;
const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeAll(() => {
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('openIdAuthorizationUrl resolver', async () => {
  const res = await openIdAuthorizationUrl(
    null,
    { openIdAuthorizationUrlInput },
    { getController }
  );
  expect(res).toEqual(openIdAuthorizationUrlInput);
});

test('openIdAuthorizationUrl graphql', async () => {
  const GET_LOGIN = gql`
    query openIdAuthorizationUrl($openIdAuthorizationUrlInput: OpenIdAuthorizationUrlInput!) {
      openIdAuthorizationUrl(openIdAuthorizationUrlInput: $openIdAuthorizationUrlInput)
    }
  `;
  const res = await runTestQuery({
    gqlQuery: GET_LOGIN,
    variables: { openIdAuthorizationUrlInput },
    loaders,
    getSecrets,
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    openIdAuthorizationUrl:
      'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI',
  });
});
