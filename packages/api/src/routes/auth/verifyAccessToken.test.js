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

import testContext from '../../test/testContext.js';
import issueAccessToken from './issueAccessToken.js';
import issueOpenIdStateToken from './issueOpenIdStateToken.js';
import verifyAccessToken from './verifyAccessToken.js';

import { AuthenticationError, TokenExpiredError } from '../../context/errors.js';

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

test('verifyAccessToken', () => {
  const token = issueAccessToken(context, {
    claims: { sub: 'sub', email: 'email' },
  });
  const claims = verifyAccessToken(context, { token });
  expect(claims).toEqual({
    aud: 'host',
    email: 'email',
    exp: 14401, // 4 hours
    iat: 1,
    iss: 'host',
    sub: 'sub',
    lowdefy_access_token: true,
  });
});

test('verifyAccessToken openIdState token invalid', () => {
  const token = issueOpenIdStateToken(context, {
    pageId: 'pageId',
    urlQuery: { u: true },
  });
  expect(() => verifyAccessToken(context, { token })).toThrow(AuthenticationError);
});

test('verifyAccessToken invalid token', () => {
  expect(() => verifyAccessToken(context, { token: 'not a token' })).toThrow(AuthenticationError);
});

test('verifyAccessToken no sub invalid token', () => {
  const token = issueAccessToken(context, {
    claims: {
      email: 'email',
    },
  });
  expect(() => verifyAccessToken(context, { token })).toThrow(AuthenticationError);
});

test('verifyAccessToken token expired', () => {
  const token = jwt.sign(
    {
      sub: 'sub',
      lowdefy_access_token: true,
      exp: -10000,
    },
    'JWT_SECRET',
    {
      audience: 'host',
      issuer: 'host',
    }
  );
  expect(() => verifyAccessToken(context, { token })).toThrow(TokenExpiredError);
});
