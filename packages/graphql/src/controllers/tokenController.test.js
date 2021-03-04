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
import { testBootstrapContext } from '../test/testContext';
import createTokenController from './tokenController';
import { AuthenticationError, TokenExpiredError } from '../context/errors';

const secrets = {
  JWT_SECRET: 'JWT_SECRET',
};

const getSecrets = () => secrets;

const context = testBootstrapContext({ getSecrets, host: 'host' });

const RealDate = Date.now;

const mockNow = jest.fn();
mockNow.mockImplementation(() => 1000);

const openIdClaims = { sub: 'sub', email: 'email' };

const openIdStateLocation = { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } };

beforeEach(() => {
  global.Date.now = mockNow;
});

afterAll(() => {
  global.Date.now = RealDate;
});

describe('access tokens', () => {
  test('issueAccessToken', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueAccessToken(openIdClaims);
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

  test('verifyAccessToken', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueAccessToken(openIdClaims);
    const claims = await tokenController.verifyAccessToken(accessToken);
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

  test('verifyAccessToken openIdState token invalid', async () => {
    const tokenController = createTokenController(context);
    const token = await tokenController.issueOpenIdStateToken(openIdStateLocation);
    await expect(tokenController.verifyAccessToken(token)).rejects.toThrow(AuthenticationError);
  });

  test('verifyAccessToken invalid token', async () => {
    const tokenController = createTokenController(context);
    await expect(tokenController.verifyAccessToken('not a token')).rejects.toThrow(
      AuthenticationError
    );
  });

  test('verifyAccessToken no sub invalid token', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueAccessToken({
      email: 'email',
    });
    await expect(tokenController.verifyAccessToken(accessToken)).rejects.toThrow(
      AuthenticationError
    );
  });

  test('verifyAccessToken token expired', async () => {
    const tokenController = createTokenController(context);
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
    await expect(tokenController.verifyAccessToken(token)).rejects.toThrow(TokenExpiredError);
  });
});

describe('openId state tokens', () => {
  test('issueOpenIdStateToken', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueOpenIdStateToken(openIdStateLocation);
    const claims = jwt.verify(accessToken, 'JWT_SECRET', {
      algorithms: ['HS256'],
      audience: 'host',
      issuer: 'host',
    });
    expect(claims).toEqual({
      aud: 'host',
      exp: 301, // 5min
      iat: 1,
      input: { i: true },
      iss: 'host',
      lowdefy_openid_state_token: true,
      pageId: 'pageId',
      urlQuery: { u: true },
    });
  });

  test('issueOpenIdStateToken, no location data', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueOpenIdStateToken({});
    const claims = jwt.verify(accessToken, 'JWT_SECRET', {
      algorithms: ['HS256'],
      audience: 'host',
      issuer: 'host',
    });
    expect(claims).toEqual({
      aud: 'host',
      exp: 301, // 5min
      iat: 1,
      iss: 'host',
      lowdefy_openid_state_token: true,
    });
  });

  test('verifyOpenIdStateToken', async () => {
    const tokenController = createTokenController(context);
    const accessToken = await tokenController.issueOpenIdStateToken(openIdStateLocation);
    const claims = await tokenController.verifyOpenIdStateToken(accessToken);
    expect(claims).toEqual({
      aud: 'host',
      exp: 301, // 5min
      iat: 1,
      input: { i: true },
      iss: 'host',
      lowdefy_openid_state_token: true,
      pageId: 'pageId',
      urlQuery: { u: true },
    });
  });

  test('verifyOpenIdStateToken access token invalid', async () => {
    const tokenController = createTokenController(context);
    const token = await tokenController.issueAccessToken(openIdClaims);
    await expect(tokenController.verifyOpenIdStateToken(token)).rejects.toThrow(
      AuthenticationError
    );
  });

  test('verifyOpenIdStateToken invalid token', async () => {
    const tokenController = createTokenController(context);
    expect(tokenController.verifyOpenIdStateToken('not a token')).rejects.toThrow(
      AuthenticationError
    );
  });

  test('verifyOpenIdStateToken token expired', async () => {
    const tokenController = createTokenController(context);
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
    await expect(tokenController.verifyOpenIdStateToken(token)).rejects.toThrow(
      AuthenticationError
    );
  });
});
