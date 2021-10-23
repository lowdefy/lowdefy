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

import cookie from 'cookie';

import { AuthenticationError, TokenExpiredError } from '../context/errors';
import issueAccessToken from '../routes/auth/issueAccessToken';
import testContext from '../test/testContext';
import verifyAuthorizationHeader from './verifyAuthorizationHeader';

const secrets = { JWT_SECRET: 'JWT_SECRET' };

const setHeader = jest.fn();

const createCookieHeader = ({ expired, customRoles } = {}) => {
  const accessToken = issueAccessToken(
    {
      secrets,
      host: 'host',
      config: {
        auth: {
          jwt: { expiresIn: expired ? -10000 : 10000 },
        },
      },
    },
    {
      claims: {
        sub: 'sub',
        email: 'email',
        customRoles,
      },
    }
  );
  return cookie.serialize('authorization', accessToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });
};

test('no cookie header', () => {
  expect(verifyAuthorizationHeader(testContext())).toEqual({ authenticated: false });
});

test('empty cookie header', () => {
  expect(verifyAuthorizationHeader(testContext({ headers: { cookie: '' } }))).toEqual({
    authenticated: false,
  });

  expect(verifyAuthorizationHeader(testContext({ headers: { cookie: 'authorization=' } }))).toEqual(
    { authenticated: false }
  );
});

test('valid authorization cookie', () => {
  const cookieHeader = createCookieHeader();
  const context = testContext({
    headers: { cookie: cookieHeader },
    secrets,
  });
  const res = verifyAuthorizationHeader(context);
  expect(res).toEqual({ authenticated: true, user: { sub: 'sub', email: 'email' }, roles: [] });
});

test('valid authorization cookie with roles', () => {
  const cookieHeader = createCookieHeader({ customRoles: ['role1', 'role2'] });
  const context = testContext({
    config: {
      auth: { openId: { rolesField: 'customRoles' } },
    },
    headers: { cookie: cookieHeader },
    secrets,
  });
  let res = verifyAuthorizationHeader(context);
  expect(res).toEqual({
    authenticated: true,
    user: { sub: 'sub', email: 'email', customRoles: ['role1', 'role2'] },
    roles: ['role1', 'role2'],
  });
});

test('invalid authorization cookie', () => {
  const context = testContext({
    headers: { cookie: 'authorization=invalid' },
    secrets,
    setHeader,
  });
  expect(() => verifyAuthorizationHeader(context)).toThrow(AuthenticationError);
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'authorization=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'],
  ]);
  expect(() => verifyAuthorizationHeader(context)).toThrow('Invalid token.');
});

test('expired token', () => {
  const cookieHeader = createCookieHeader({ expired: true });
  const context = testContext({
    headers: { cookie: cookieHeader },
    secrets,
    setHeader,
  });

  expect(() => verifyAuthorizationHeader(context)).toThrow(TokenExpiredError);
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'authorization=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'],
  ]);
  expect(() => verifyAuthorizationHeader(context)).toThrow('Token expired.');
});

test('http header', () => {
  let context = testContext({
    headers: { cookie: 'authorization=invalid' },
    secrets,
    setHeader,
    protocol: 'http',
  });
  expect(() => verifyAuthorizationHeader(context)).toThrow(AuthenticationError);
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'authorization=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'],
  ]);
});
