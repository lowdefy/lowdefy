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

const secrets = {
  JWT_SECRET: 'JWT_SECRET',
};

const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

beforeEach(() => {
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

test('issueAccessToken', () => {
  const accessToken = issueAccessToken(testContext({ host: 'host', secrets }), {
    claims: { sub: 'sub', email: 'email' },
  });

  const claims = jwt.verify(accessToken, 'JWT_SECRET', {
    algorithms: ['HS256'],
    audience: 'host',
    issuer: 'host',
  });
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

test('issueAccessToken, configure token expiry', () => {
  const accessToken = issueAccessToken(
    testContext({
      config: {
        auth: {
          jwt: {
            expiresIn: '12h',
          },
        },
      },
      host: 'host',
      secrets,
    }),
    { claims: { sub: 'sub', email: 'email' } }
  );
  const claims = jwt.verify(accessToken, 'JWT_SECRET', {
    algorithms: ['HS256'],
    audience: 'host',
    issuer: 'host',
  });
  expect(claims).toEqual({
    aud: 'host',
    email: 'email',
    exp: 43201, // 12 hours
    iat: 1,
    iss: 'host',
    sub: 'sub',
    lowdefy_access_token: true,
  });
});
