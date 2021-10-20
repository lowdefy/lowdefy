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

import jwt from 'jsonwebtoken';

import testContext from '../../test/testContext';
import issueAccessToken from './issueAccessToken';
import issueOpenIdStateToken from './issueOpenIdStateToken';
import verifyOpenIdStateToken from './verifyOpenIdStateToken';

import { AuthenticationError } from '../../context/errors';

const secrets = {
  JWT_SECRET: 'JWT_SECRET',
};

const context = testContext({ host: 'host', secrets });

const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeEach(() => {
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('verifyOpenIdStateToken', () => {
  const token = issueOpenIdStateToken(context, {
    pageId: 'pageId',
    urlQuery: { u: true },
  });
  const claims = verifyOpenIdStateToken(context, { token });
  expect(claims).toEqual({
    aud: 'host',
    exp: 301, // 5min
    iat: 1,
    iss: 'host',
    lowdefy_openid_state_token: true,
    pageId: 'pageId',
    urlQuery: { u: true },
  });
});

test('verifyOpenIdStateToken access token invalid', () => {
  const token = issueAccessToken(context, {
    claims: { sub: 'sub', email: 'email' },
  });
  expect(() => verifyOpenIdStateToken(context, { token })).toThrow(AuthenticationError);
});

test('verifyOpenIdStateToken invalid token', () => {
  expect(() => verifyOpenIdStateToken(context, { token: 'not a token' })).toThrow(
    AuthenticationError
  );
});

test('verifyOpenIdStateToken token expired', () => {
  const token = jwt.sign(
    {
      lowdefy_openid_state_token: true,
      exp: -10000,
    },
    'JWT_SECRET',
    {
      audience: 'host',
      issuer: 'host',
    }
  );
  expect(() => verifyOpenIdStateToken(context, { token })).toThrow(AuthenticationError);
});
