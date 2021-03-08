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
import createTokenController from './tokenController';
import { AuthenticationError, ConfigurationError } from '../context/errors';

jest.mock('openid-client');

const mockOpenIdAuthorizationUrl = jest.fn(
  // eslint-disable-next-line camelcase
  ({ redirect_uri, response_type, scope, state }) =>
    `${redirect_uri}:${response_type}:${scope}:${state}`
);

const mockOpenIdCallback = jest.fn(() => ({
  claims: () => ({ sub: 'sub' }),
  id_token: 'id_token',
}));

const mockEndSessionUrl = jest.fn(
  ({ id_token_hint, post_logout_redirect_uri }) => `${id_token_hint}:${post_logout_redirect_uri}`
);

const mockClient = jest.fn(() => ({
  authorizationUrl: mockOpenIdAuthorizationUrl,
  callback: mockOpenIdCallback,
  endSessionUrl: mockEndSessionUrl,
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
const logoutUrlInput = { idToken: 'idToken' };
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
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      AuthenticationError
    );
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      'OpenID Connect is not configured.'
    );
    expect(setHeaders).toEqual([]);
  });

  test('callback', async () => {
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(ctx);
    const tokenController = createTokenController(ctx);
    const state = await tokenController.issueOpenIdStateToken(authorizationUrlInput);
    const res = await openIdController.callback({ code: 'code', state });
    expect(mockClient.mock.calls).toEqual([
      [
        {
          client_id: 'OPENID_CLIENT_ID',
          client_secret: 'OPENID_CLIENT_SECRET',
          redirect_uris: ['https://host/auth/openid-callback'],
        },
      ],
    ]);
    expect(mockOpenIdCallback.mock.calls).toEqual([
      [
        'https://host/auth/openid-callback',
        {
          code: 'code',
        },
        {
          response_type: 'code',
        },
      ],
    ]);
    expect(res).toEqual({
      idToken: 'id_token',
      input: {
        i: true,
      },
      pageId: 'pageId',
      urlQuery: {
        u: true,
      },
    });
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value:
          'authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdWIiLCJsb3dkZWZ5X2FjY2Vzc190b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjQzMjAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.GAK4KVAytEAsNLO9wAC6mKteqQqucLzFl8DJuNDCz5Q; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, invalid state', async () => {
    getSecrets.mockImplementation(() => secrets);
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      AuthenticationError
    );
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      'AuthenticationError: Invalid token.'
    );
    expect(setHeaders).toEqual([]);
  });

  test('callback, openId callback error', async () => {
    getSecrets.mockImplementation(() => secrets);
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const tokenController = createTokenController(ctx);
    const state = await tokenController.issueOpenIdStateToken(authorizationUrlInput);
    mockOpenIdCallback.mockImplementationOnce(() => {
      throw new Error('OpenId Callback Error');
    });
    await expect(openIdController.callback({ code: 'code', state })).rejects.toThrow(
      AuthenticationError
    );
    mockOpenIdCallback.mockImplementationOnce(() => {
      throw new Error('OpenId Callback Error');
    });
    await expect(openIdController.callback({ code: 'code', state })).rejects.toThrow(
      'Error: OpenId Callback Error'
    );
    expect(setHeaders).toEqual([]);
  });
});

describe('logout', () => {
  test('callback, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual(null);
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, logoutFromProvider !== true, no logoutRedirectUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual(null);
    expect(mockEndSessionUrl.mock.calls).toEqual([]);
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, logoutFromProvider !== true, with logoutRedirectUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          logoutRedirectUri: 'logoutRedirectUri',
        },
      },
    }));
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual('logoutRedirectUri');
    expect(mockEndSessionUrl.mock.calls).toEqual([]);
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, logoutFromProvider, no logoutRedirectUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          logoutFromProvider: true,
        },
      },
    }));
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(mockClient.mock.calls).toEqual([
      [
        {
          client_id: 'OPENID_CLIENT_ID',
          client_secret: 'OPENID_CLIENT_SECRET',
          redirect_uris: ['https://host/auth/openid-callback'],
        },
      ],
    ]);
    expect(url).toEqual('idToken:undefined');
    expect(mockEndSessionUrl.mock.calls).toEqual([
      [
        {
          id_token_hint: 'idToken',
        },
      ],
    ]);
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, logoutFromProvider, with logoutRedirectUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          logoutFromProvider: true,
          logoutRedirectUri: 'logoutRedirectUri',
        },
      },
    }));
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(mockClient.mock.calls).toEqual([
      [
        {
          client_id: 'OPENID_CLIENT_ID',
          client_secret: 'OPENID_CLIENT_SECRET',
          redirect_uris: ['https://host/auth/openid-callback'],
        },
      ],
    ]);
    expect(url).toEqual('idToken:logoutRedirectUri');
    expect(mockEndSessionUrl.mock.calls).toEqual([
      [
        {
          id_token_hint: 'idToken',
          post_logout_redirect_uri: 'logoutRedirectUri',
        },
      ],
    ]);
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });

  test('callback, logoutFromProvider, error', async () => {
    getSecrets.mockImplementation(() => secrets);
    mockLoadComponent.mockImplementation(() => ({
      auth: {
        openId: {
          logoutFromProvider: true,
        },
      },
    }));
    const setHeaders = [];
    const ctx = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeaders });
    const openIdController = createOpenIdController(ctx);
    mockEndSessionUrl.mockImplementationOnce(() => {
      throw new Error('OpenId End Session Error');
    });
    await expect(openIdController.logoutUrl(logoutUrlInput)).rejects.toThrow(AuthenticationError);
    mockEndSessionUrl.mockImplementationOnce(() => {
      throw new Error('OpenId End Session Error');
    });
    await expect(openIdController.logoutUrl(logoutUrlInput)).rejects.toThrow(
      'Error: OpenId End Session Error'
    );
    expect(setHeaders).toEqual([
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
      {
        key: 'Set-Cookie',
        value: 'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      },
    ]);
  });
});
