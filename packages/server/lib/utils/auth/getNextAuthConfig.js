/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { NodeParser } from '@lowdefy/operators';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { _secret } from '@lowdefy/operators-js/operators/server';

import authJson from '../../../build/auth.json';
import getProviders from './getProviders.js';

const nextAuthConfig = {};
let initialized = false;

const callbacks = {
  jwt: async ({ token, user, account, profile, isNewUser }) => {
    console.log('jwt callback');
    console.log('token', token);
    console.log('user', user);
    console.log('account', account);
    console.log('profile', profile);
    console.log('isNewUser', isNewUser);

    return token;
  },
  session: async ({ session, user, token }) => {
    console.log('session callback');
    console.log('session', session);
    console.log('user', user);
    console.log('token', token);
    session.sub = token.sub;
    return session;
  },
  async redirect({ url, baseUrl }) {
    console.log('redirect callback', url, baseUrl);
    // Allows relative callback URLs
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    // Allows callback URLs on the same origin
    else if (new URL(url).origin === baseUrl) return url;
    return baseUrl;
  },
};

function getNextAuthConfig() {
  if (initialized) return nextAuthConfig;

  const operatorsParser = new NodeParser({
    // TODO: do we want to support other operators here?
    operators: { _secret },
    payload: {},
    secrets: getSecretsFromEnv(),
    user: {},
  });

  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
  });

  if (operatorErrors.length > 0) {
    throw new Error(operatorErrors[0]);
  }

  nextAuthConfig.providers = getProviders(authConfig);

  // We can either configure this using auth config,
  // then the user configures this using the _secret operator
  // -> authConfig.secret = evaluatedAuthConfig.secret;
  // or we can create a fixed env var/secret name that we read.
  // -> authConfig.secret = secrets.LOWDEFY_AUTH_SECRET;
  nextAuthConfig.secret = 'TODO: Configure secret';

  nextAuthConfig.callbacks = callbacks;
  nextAuthConfig.theme = authConfig.theme;
  initialized = true;
  console.log(JSON.stringify(nextAuthConfig, null, 2));
  return nextAuthConfig;
}

export default getNextAuthConfig;
