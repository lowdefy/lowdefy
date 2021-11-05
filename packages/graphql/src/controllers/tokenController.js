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

import { get } from '@lowdefy/helpers';
import jwt from 'jsonwebtoken';
import { AuthenticationError, TokenExpiredError } from '../context/errors';

class TokenController {
  constructor({ getLoader, getSecrets, host }) {
    this.host = host;
    this.getSecrets = getSecrets;
    this.componentLoader = getLoader('component');
  }

  async issueAccessToken(claims) {
    const { JWT_SECRET } = await this.getSecrets();
    const appConfig = await this.componentLoader.load('config');
    const { expiresIn } = get(appConfig, 'auth.jwt', { default: {} });
    // eslint-disable-next-line no-unused-vars
    const { aud, exp, iat, iss, ...otherClaims } = claims;
    return jwt.sign(
      {
        ...otherClaims,
        lowdefy_access_token: true,
      },
      JWT_SECRET,
      {
        expiresIn: expiresIn || '4h',
        audience: this.host,
        issuer: this.host,
      }
    );
  }

  async verifyAccessToken(token) {
    try {
      const { JWT_SECRET } = await this.getSecrets();
      const claims = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        audience: this.host,
        issuer: this.host,
      });

      if (claims.lowdefy_access_token !== true) {
        throw new AuthenticationError('Invalid token.');
      }
      if (!claims.sub) {
        throw new AuthenticationError('Invalid token.');
      }
      return claims;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Token expired.');
      } else {
        throw new AuthenticationError('Invalid token.');
      }
    }
  }

  async issueOpenIdStateToken({ input, pageId, urlQuery }) {
    const { JWT_SECRET } = await this.getSecrets();
    const appConfig = await this.componentLoader.load('config');
    const { stateExpiresIn } = get(appConfig, 'auth.jwt', { default: {} });
    return jwt.sign(
      {
        input,
        lowdefy_openid_state_token: true,
        pageId,
        urlQuery,
      },
      JWT_SECRET,
      {
        expiresIn: stateExpiresIn || '5min',
        audience: this.host,
        issuer: this.host,
      }
    );
  }

  async verifyOpenIdStateToken(token) {
    try {
      const { JWT_SECRET } = await this.getSecrets();
      const claims = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        audience: this.host,
        issuer: this.host,
      });

      if (claims.lowdefy_openid_state_token !== true) {
        throw new AuthenticationError('Invalid token.');
      }
      return claims;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired.');
      } else {
        throw new AuthenticationError('Invalid token.');
      }
    }
  }
}

function createTokenController(context) {
  return new TokenController(context);
}

export { TokenController };

export default createTokenController;
