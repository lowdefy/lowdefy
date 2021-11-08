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

import { ConfigurationError } from '../../context/errors.js';

function getOpenIdConfig({ protocol, host, config, secrets }) {
  const { OPENID_CLIENT_ID, OPENID_CLIENT_SECRET, OPENID_DOMAIN } = secrets;

  if (!(OPENID_CLIENT_ID && OPENID_CLIENT_SECRET && OPENID_DOMAIN)) {
    throw new ConfigurationError('Invalid OpenID Connect configuration.');
  }

  const userOpenIdConfig = get(config, 'auth.openId', { default: {} });
  return {
    ...userOpenIdConfig,
    clientId: OPENID_CLIENT_ID,
    clientSecret: OPENID_CLIENT_SECRET,
    domain: OPENID_DOMAIN,
    redirectUri: `${protocol}://${host}/auth/openid-callback`,
  };
}

export default getOpenIdConfig;
