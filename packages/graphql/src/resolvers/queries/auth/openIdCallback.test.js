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

// // eslint-disable-next-line no-unused-vars
import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';
import { testBootstrapContext } from '../../../test/testContext';
import createTokenController from '../../../controllers/tokenController';

import { Issuer } from 'openid-client';

import openIdCallback from './openIdCallback';

jest.mock('openid-client');

// Controller mocks
const mockCallback = jest.fn(({ code, state }) => `${code}:${state}`);

const getController = jest.fn((name) => {
  if (name === 'openId') {
    return {
      callback: mockCallback,
    };
  }
});

// OpenID mocks
const mockOpenIdCallback = jest.fn(() => ({
  claims: () => ({ sub: 'sub' }),
  id_token: 'id_token',
}));

const mockClient = jest.fn(() => ({
  callback: mockOpenIdCallback,
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

const bootstrapContext = testBootstrapContext({ getSecrets, host: 'host', loaders });
const tokenController = createTokenController(bootstrapContext);

const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeAll(() => {
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('openIdCallback resolver', async () => {
  const res = await openIdCallback(
    null,
    { openIdCallbackInput: { code: 'code', state: 'state' } },
    { getController }
  );
  expect(res).toEqual('code:state');
});

test('openIdCallback graphql', async () => {
  const state = await tokenController.issueOpenIdStateToken({
    input: { i: true },
    pageId: 'pageId',
    urlQuery: { u: true },
  });
  const OPENID_CALLBACK = gql`
    query openIdCallback($openIdCallbackInput: OpenIdCallbackInput!) {
      openIdCallback(openIdCallbackInput: $openIdCallbackInput) {
        idToken
        input
        pageId
        urlQuery
      }
    }
  `;
  const setHeaders = [];
  const res = await runTestQuery({
    gqlQuery: OPENID_CALLBACK,
    variables: { openIdCallbackInput: { code: 'code', state } },
    loaders,
    getSecrets,
    setHeaders,
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    openIdCallback: {
      idToken: 'id_token',
      input: {
        i: true,
      },
      pageId: 'pageId',
      urlQuery: {
        u: true,
      },
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
