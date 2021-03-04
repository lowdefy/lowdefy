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
import { testBootstrapContext } from '../test/testContext';
import createOpenIdController from './openIdController';
import { AuthenticationError, ConfigurationError } from '../context/errors';

jest.mock('openid-client');

const mockopenIdAuthorizationUrl = jest.fn(
  // eslint-disable-next-line camelcase
  ({ redirect_uri, response_type, scope, state }) =>
    `${redirect_uri}:${response_type}:${scope}:${state}`
);

const mockClient = jest.fn(() => ({
  authorizationUrl: mockopenIdAuthorizationUrl,
}));

// eslint-disable-next-line no-undef
Issuer.discover = jest.fn(() => ({
  Client: mockClient,
}));

const secrets = {
  OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
  OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
  OPENID_DOMAIN: 'OPENID_DOMAIN',
  JWT_SECRET: 'JWT_SECRET',
};

const mockLoadComponent = jest.fn();
const loaders = {
  component: {
    load: mockLoadComponent,
  },
};

const getSecrets = jest.fn();

const context = testBootstrapContext({ getSecrets, host: 'host', loaders });

const authorizationUrlInput = { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } };
const callbackInput = { code: 'code', state: 'state' };

const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeEach(() => {
  mockLoadComponent.mockReset();
  getSecrets.mockReset();
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

describe('getOpenIdConfig', () => {
  test('getOpenIdConfig, no optional config', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const config = await openIdController.getOpenIdConfig();
    expect(config).toEqual({
      clientId: 'OPENID_CLIENT_ID',
      clientSecret: 'OPENID_CLIENT_SECRET',
      domain: 'OPENID_DOMAIN',
    });
  });

  test('getOpenIdConfig, all optional config', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          logoutFromProvider: true,
          logoutRedirectUri: 'logoutRedirectUri',
          scope: 'scope',
        },
      },
    }));
    const openIdController = createOpenIdController(context);
    const config = await openIdController.getOpenIdConfig();
    expect(config).toEqual({
      clientId: 'OPENID_CLIENT_ID',
      clientSecret: 'OPENID_CLIENT_SECRET',
      domain: 'OPENID_DOMAIN',
      logoutFromProvider: true,
      logoutRedirectUri: 'logoutRedirectUri',
      scope: 'scope',
    });
  });

  test('getOpenIdConfig, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const openIdController = createOpenIdController(context);
    const config = await openIdController.getOpenIdConfig();
    expect(config).toEqual(null);
  });

  test('getOpenIdConfig, some openId config', async () => {
    const openIdController = createOpenIdController(context);

    getSecrets.mockImplementationOnce(() => ({ OPENID_CLIENT_ID: 'OPENID_CLIENT_ID' }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );
    getSecrets.mockImplementationOnce(() => ({ OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET' }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );
    getSecrets.mockImplementationOnce(() => ({ OPENID_DOMAIN: 'OPENID_DOMAIN' }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );

    getSecrets.mockImplementationOnce(() => ({
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );
    getSecrets.mockImplementationOnce(() => ({
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );
    getSecrets.mockImplementationOnce(() => ({
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
    }));
    await expect(openIdController.getOpenIdConfig()).rejects.toThrow(
      'Invalid OpenID Connect configuration.'
    );
  });
});

describe('authorizationUrl', () => {
  test('authorizationUrl, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const openIdController = createOpenIdController(context);
    const url = await openIdController.authorizationUrl(authorizationUrlInput);
    expect(url).toEqual(null);
  });

  test('authorizationUrl, no optional config', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const url = await openIdController.authorizationUrl(authorizationUrlInput);
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
      'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI'
    );
  });

  test('authorizationUrl, set scope', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          scope: 'custom scope',
        },
      },
    }));
    const openIdController = createOpenIdController(context);
    const url = await openIdController.authorizationUrl(authorizationUrlInput);
    expect(url).toEqual(
      'https://host/auth/openid-callback:code:custom scope:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI'
    );
  });

  test('redirect Uris', async () => {
    const openIdController = createOpenIdController(context);
    expect(openIdController.redirectUri).toEqual('https://host/auth/openid-callback');

    const devOpenIdController = createOpenIdController(
      testBootstrapContext({ getSecrets, host: 'host', loaders, development: true })
    );
    expect(devOpenIdController.redirectUri).toEqual('http://host/auth/openid-callback');
  });

  test('authorizationUrl, jwt config error', async () => {
    getSecrets.mockImplementation(() => ({
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    }));
    const openIdController = createOpenIdController(context);
    await expect(openIdController.authorizationUrl(authorizationUrlInput)).rejects.toThrow(
      ConfigurationError
    );
  });
});

describe('callback', () => {
  test('callback, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const openIdController = createOpenIdController(context);
    await expect(openIdController.callback(callbackInput)).rejects.toThrow(AuthenticationError);
    await expect(openIdController.callback(callbackInput)).rejects.toThrow(
      'OpenID Connect is not configured.'
    );
  });
});
