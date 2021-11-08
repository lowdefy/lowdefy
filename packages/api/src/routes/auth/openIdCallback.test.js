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
import openIdCallback from './openIdCallback.js';
import issueOpenIdStateToken from './issueOpenIdStateToken.js';
import testContext from '../../test/testContext.js';
import setAuthorizationCookie from './setAuthorizationCookie.js';
import setIdTokenCookie from './setIdTokenCookie.js';
import { AuthenticationError, ConfigurationError } from '../../context/errors.js';

jest.mock('./setAuthorizationCookie');
jest.mock('./setIdTokenCookie');
jest.mock('openid-client');

const mockOpenIdCallback = jest.fn(() => ({
  claims: () => ({ sub: 'sub' }),
  id_token: 'id_token',
}));

const mockClient = jest.fn(() => ({
  callback: mockOpenIdCallback,
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

const RealDate = Date.now;
const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);
global.Date.now = mockNow;

beforeEach(() => {
  setAuthorizationCookie.mockReset();
  setIdTokenCookie.mockReset();
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('callback, no openId config', async () => {
  const context = testContext({});
  await expect(openIdCallback(context, { code: 'code', state: 'state' })).rejects.toThrow(
    ConfigurationError
  );
  await expect(openIdCallback(context, { code: 'code', state: 'state' })).rejects.toThrow(
    'Invalid OpenID Connect configuration.'
  );
  expect(setAuthorizationCookie.mock.calls).toEqual([]);
});

test('callback', async () => {
  const context = testContext({ secrets });
  const state = issueOpenIdStateToken(context, {
    pageId: 'pageId',
    urlQuery: { u: true },
  });
  const res = await openIdCallback(context, { code: 'code', state });
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
    pageId: 'pageId',
    urlQuery: {
      u: true,
    },
  });
  expect(setAuthorizationCookie.mock.calls[0][1]).toEqual({
    accessToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdWIiLCJsb3dkZWZ5X2FjY2Vzc190b2tlbiI6dHJ1ZSwiaWF0IjoxLCJleHAiOjE0NDAxLCJhdWQiOiJob3N0IiwiaXNzIjoiaG9zdCJ9.oADZ37ERfvONPBGiFsStQUOEHO6BaX_zkGXCHY8PbRA',
  });
  expect(setIdTokenCookie.mock.calls[0][1]).toEqual({
    idToken: 'id_token',
  });
});

test('callback, invalid state', async () => {
  const context = testContext({ secrets });
  await expect(openIdCallback(context, { code: 'code', state: 'state' })).rejects.toThrow(
    AuthenticationError
  );
  await expect(openIdCallback(context, { code: 'code', state: 'state' })).rejects.toThrow(
    'Invalid token.'
  );
  expect(setAuthorizationCookie.mock.calls).toEqual([]);
});

test('callback, openId callback error', async () => {
  const context = testContext({ secrets });
  const state = issueOpenIdStateToken(context, {
    pageId: 'pageId',
    urlQuery: { u: true },
  });
  mockOpenIdCallback.mockImplementationOnce(() => {
    throw new Error('OpenId Callback Error');
  });
  await expect(openIdCallback(context, { code: 'code', state })).rejects.toThrow(
    AuthenticationError
  );
  mockOpenIdCallback.mockImplementationOnce(() => {
    throw new Error('OpenId Callback Error');
  });
  await expect(openIdCallback(context, { code: 'code', state })).rejects.toThrow(
    'OpenId Callback Error'
  );
  expect(setAuthorizationCookie.mock.calls).toEqual([]);
});
