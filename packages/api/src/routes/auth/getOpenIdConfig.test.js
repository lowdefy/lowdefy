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

import getOpenIdConfig from './getOpenIdConfig';
import testContext from '../../test/testContext.js';

import { ConfigurationError } from '../../context/errors.js';

const secrets = {
  OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
  OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
  OPENID_DOMAIN: 'OPENID_DOMAIN',
  JWT_SECRET: 'JWT_SECRET',
};

test('getOpenIdConfig, no optional config', () => {
  const context = testContext({ secrets });

  const config = getOpenIdConfig(context);
  expect(config).toEqual({
    clientId: 'OPENID_CLIENT_ID',
    clientSecret: 'OPENID_CLIENT_SECRET',
    domain: 'OPENID_DOMAIN',
    redirectUri: 'https://host/auth/openid-callback',
  });
});

test('getOpenIdConfig with protocol http', () => {
  const context = testContext({ secrets, protocol: 'http' });

  const config = getOpenIdConfig(context);
  expect(config).toEqual({
    clientId: 'OPENID_CLIENT_ID',
    clientSecret: 'OPENID_CLIENT_SECRET',
    domain: 'OPENID_DOMAIN',
    redirectUri: 'http://host/auth/openid-callback',
  });
});

test('getOpenIdConfig, all optional config', () => {
  const context = testContext({
    secrets,
    config: {
      auth: {
        openId: {
          logoutFromProvider: true,
          logoutRedirectUri: 'logoutRedirectUri',
          scope: 'scope',
        },
      },
    },
  });

  const config = getOpenIdConfig(context);
  expect(config).toEqual({
    clientId: 'OPENID_CLIENT_ID',
    clientSecret: 'OPENID_CLIENT_SECRET',
    domain: 'OPENID_DOMAIN',
    logoutFromProvider: true,
    logoutRedirectUri: 'logoutRedirectUri',
    redirectUri: 'https://host/auth/openid-callback',
    scope: 'scope',
  });
});

test('getOpenIdConfig, no openId config', () => {
  const context = testContext({});
  expect(() => getOpenIdConfig(context)).toThrow(ConfigurationError);
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');
});

test('getOpenIdConfig, partial openId config', () => {
  let context = testContext({ secrets: { OPENID_CLIENT_ID: 'OPENID_CLIENT_ID' } });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');

  context = testContext({ secrets: { OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET' } });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');

  context = testContext({ secrets: { OPENID_DOMAIN: 'OPENID_DOMAIN' } });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');

  context = testContext({
    secrets: {
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    },
  });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');

  context = testContext({
    secrets: {
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_DOMAIN: 'OPENID_DOMAIN',
    },
  });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');

  context = testContext({
    secrets: {
      OPENID_CLIENT_ID: 'OPENID_CLIENT_ID',
      OPENID_CLIENT_SECRET: 'OPENID_CLIENT_SECRET',
    },
  });
  expect(() => getOpenIdConfig(context)).toThrow('Invalid OpenID Connect configuration.');
});
