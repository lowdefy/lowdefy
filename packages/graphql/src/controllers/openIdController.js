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
import { Issuer } from 'openid-client';
import cookie from 'cookie';

import { AuthenticationError, ConfigurationError } from '../context/errors';

class OpenIdController {
  constructor({ development, getController, getLoader, getSecrets, gqlUri, host, setHeader }) {
    const httpPrefix = development ? 'http' : 'https';

    this.development = development;
    this.componentLoader = getLoader('component');
    this.getSecrets = getSecrets;
    this.host = host;
    this.redirectUri = `${httpPrefix}://${host}/auth/openid-callback`;
    this.gqlUri = gqlUri || '/api/graphql';
    this.setHeader = setHeader;
    this.tokenController = getController('token');
  }

  async getOpenIdConfig() {
    const { OPENID_CLIENT_ID, OPENID_CLIENT_SECRET, OPENID_DOMAIN } = await this.getSecrets();

    if (!(OPENID_CLIENT_ID || OPENID_CLIENT_SECRET || OPENID_DOMAIN)) return null;

    if (!(OPENID_CLIENT_ID && OPENID_CLIENT_SECRET && OPENID_DOMAIN)) {
      throw new ConfigurationError('Invalid OpenID Connect configuration.');
    }

    const appConfig = await this.componentLoader.load('config');
    const openIdConfig = get(appConfig, 'auth.openId', { default: {} });

    return {
      ...openIdConfig,
      clientId: OPENID_CLIENT_ID,
      clientSecret: OPENID_CLIENT_SECRET,
      domain: OPENID_DOMAIN,
    };
  }

  async getClient({ config }) {
    const issuer = await Issuer.discover(config.domain);
    return new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [this.redirectUri],
    });
  }

  async authorizationUrl({ input, pageId, urlQuery }) {
    try {
      const config = await this.getOpenIdConfig();
      if (!config) return null;

      const state = await this.tokenController.issueOpenIdStateToken({
        input,
        pageId,
        urlQuery,
      });
      return this.getAuthorizationUrl({ config, state });
    } catch (error) {
      throw new ConfigurationError(error);
    }
  }

  async getAuthorizationUrl({ config, state }) {
    const client = await this.getClient({ config });
    const url = client.authorizationUrl({
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: config.scope || 'openid profile email',
      state,
    });
    return url;
  }

  async callback({ code, state }) {
    try {
      const config = await this.getOpenIdConfig();
      if (!config) {
        throw new Error('OpenID Connect is not configured.');
      }
      const { input, pageId, urlQuery } = await this.tokenController.verifyOpenIdStateToken(state);

      const { claims, idToken } = await this.openIdCallback({ code, config });

      const accessToken = await this.tokenController.issueAccessToken(claims);
      const setCookieHeader = cookie.serialize('authorization', accessToken, {
        httpOnly: true,
        path: this.gqlUri,
        sameSite: 'lax',
        secure: !this.development,
      });

      this.setHeader('Set-Cookie', setCookieHeader);
      return {
        idToken,
        input,
        pageId,
        urlQuery,
      };
    } catch (error) {
      throw new AuthenticationError(error);
    }
  }

  async openIdCallback({ code, config }) {
    const client = await this.getClient({ config });
    const tokenSet = await client.callback(
      this.redirectUri,
      {
        code,
      },
      {
        response_type: 'code',
      }
    );
    return {
      claims: tokenSet.claims(),
      idToken: tokenSet.id_token,
    };
  }

  async logoutUrl({ idToken }) {
    try {
      const setCookieHeader = cookie.serialize('authorization', '', {
        httpOnly: true,
        path: this.gqlUri,
        sameSite: 'lax',
        secure: !this.development,
        maxAge: 0,
      });
      this.setHeader('Set-Cookie', setCookieHeader);

      const config = await this.getOpenIdConfig();
      if (!config) return null;

      if (config.logoutFromProvider !== true) {
        return config.logoutRedirectUri || null;
      }

      const client = await this.getClient({ config });

      return client.endSessionUrl({
        id_token_hint: idToken,
        post_logout_redirect_uri: config.logoutRedirectUri,
      });
    } catch (error) {
      throw new AuthenticationError(error);
    }
  }
}

function createOpenIdController(context) {
  return new OpenIdController(context);
}

export { OpenIdController };

export default createOpenIdController;
