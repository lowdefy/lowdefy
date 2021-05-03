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
  ({ redirect_uri, response_type, scope, state, ...additional }) =>
    `${redirect_uri}:${response_type}:${scope}:${state}:${JSON.stringify(additional)}`
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
const setHeader = jest.fn();

const context = testBootstrapContext({ getSecrets, host: 'host', loaders, setHeader });

const authorizationUrlInput = { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } };
const logoutUrlInput = { idToken: 'idToken' };
const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeEach(() => {
  mockLoadComponent.mockReset();
  getSecrets.mockReset();
  setHeader.mockReset();
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
      'https://host/auth/openid-callback:code:openid profile email:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI:{}'
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
      'https://host/auth/openid-callback:code:custom scope:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnB1dCI6eyJpIjp0cnVlfSwibG93ZGVmeV9vcGVuaWRfc3RhdGVfdG9rZW4iOnRydWUsInBhZ2VJZCI6InBhZ2VJZCIsInVybFF1ZXJ5Ijp7InUiOnRydWV9LCJpYXQiOjEsImV4cCI6MzAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.-GLdtCspyagMhdx9z1VootZXXbIdLY3cbzpn5UK8eGI:{}'
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

  test('authorizationUrl, additional query params', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const url = await openIdController.authorizationUrl({
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

  test('authorizationUrl, additional query do not overwrite fiexed params', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const url = await openIdController.authorizationUrl({
      authUrlQueryParams: {
        redirect_uri: 'overwritten',
        response_type: 'overwritten',
        scope: 'overwritten',
        state: 'overwritten',
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
});

describe('callback', () => {
  test('callback, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const openIdController = createOpenIdController(context);
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      AuthenticationError
    );
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      'OpenID Connect is not configured.'
    );
    expect(setHeader.mock.calls).toEqual([]);
  });

  test('callback', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const tokenController = createTokenController(context);
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
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdWIiLCJsb3dkZWZ5X2FjY2Vzc190b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjE0NDAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.oADZ37ERfvONPBGiFsStQUOEHO6BaX_zkGXCHY8PbRA; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
    ]);
  });

  test('callback, invalid state', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      AuthenticationError
    );
    await expect(openIdController.callback({ code: 'code', state: 'state' })).rejects.toThrow(
      'AuthenticationError: Invalid token.'
    );
    expect(setHeader.mock.calls).toEqual([]);
  });

  test('callback, openId callback error', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const tokenController = createTokenController(context);
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
    expect(setHeader.mock.calls).toEqual([]);
  });

  test('configure gqlUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    const testContext = testBootstrapContext({
      getSecrets,
      gqlUri: '/custom/graphql',
      host: 'host',
      loaders,
      setHeader,
    });
    const openIdController = createOpenIdController(testContext);
    const tokenController = createTokenController(testContext);
    const state = await tokenController.issueOpenIdStateToken(authorizationUrlInput);
    await openIdController.callback({ code: 'code', state });
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdWIiLCJsb3dkZWZ5X2FjY2Vzc190b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjE0NDAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.oADZ37ERfvONPBGiFsStQUOEHO6BaX_zkGXCHY8PbRA; Path=/custom/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
    ]);
  });
});

describe('logout', () => {
  test('callback, no openId config', async () => {
    getSecrets.mockImplementation(() => ({}));
    const openIdController = createOpenIdController(context);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual(null);
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
    ]);
  });

  test('callback, logoutFromProvider !== true, no logoutRedirectUri', async () => {
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(context);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual(null);
    expect(mockEndSessionUrl.mock.calls).toEqual([]);
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
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
    const openIdController = createOpenIdController(context);
    const url = await openIdController.logoutUrl(logoutUrlInput);
    expect(url).toEqual('logoutRedirectUri');
    expect(mockEndSessionUrl.mock.calls).toEqual([]);
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
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
    const openIdController = createOpenIdController(context);
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
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
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
    const openIdController = createOpenIdController(context);
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
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
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
    const openIdController = createOpenIdController(context);
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
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/api/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
    ]);
  });

  test('configure gqlUri', async () => {
    const testContext = testBootstrapContext({
      getSecrets,
      gqlUri: '/custom/graphql',
      host: 'host',
      loaders,
      setHeader,
    });
    getSecrets.mockImplementation(() => secrets);
    const openIdController = createOpenIdController(testContext);
    await openIdController.logoutUrl(logoutUrlInput);
    expect(setHeader.mock.calls).toEqual([
      [
        'Set-Cookie',
        'authorization=; Max-Age=0; Path=/custom/graphql; HttpOnly; Secure; SameSite=Lax',
      ],
    ]);
  });
});
