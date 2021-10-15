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

import { type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';

import { AuthenticationError } from '../../context/errors';

import getOpenIdConfig from './getOpenIdConfig';
import unsetAuthenticationCookie from './unsetAuthenticationCookie';

function parseLogoutUrlNunjucks(context, { openIdConfig, idToken }) {
  const template = nunjucksFunction(openIdConfig.logoutRedirectUri);
  return template({
    id_token_hint: idToken,
    client_id: openIdConfig.clientId,
    openid_domain: openIdConfig.domain,
    host: encodeURIComponent(`${context.protocol}://${context.host}`),
  });
}

function openIdLogoutUrl(context, { idToken }) {
  try {
    unsetAuthenticationCookie(context);

    const openIdConfig = getOpenIdConfig(context);
    if (!type.isString(openIdConfig.logoutRedirectUri)) return null;

    return parseLogoutUrlNunjucks(context, { openIdConfig, idToken });
  } catch (error) {
    throw new AuthenticationError(error);
  }
}

export default openIdLogoutUrl;
