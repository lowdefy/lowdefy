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

/* eslint-disable no-unused-vars */

import { get } from '@lowdefy/helpers';
import cookie from 'cookie';

import verifyAccessToken from '../routes/auth/verifyAccessToken';
import unsetAuthenticationCookie from '../routes/auth/unsetAuthenticationCookie';

function verifyAuthorizationHeader(context) {
  const { config, headers } = context;
  const cookieHeader = get(headers, 'cookie') || '';
  const { authorization: token } = cookie.parse(cookieHeader);
  if (!token) return {};
  try {
    const { iat, exp, aud, iss, lowdefy_access_token, ...user } = verifyAccessToken(context, {
      token,
    });
    const rolesField = get(config, 'auth.openId.rolesField');
    let roles = [];
    if (rolesField) {
      roles = get(user, rolesField);
    }
    return { user, roles };
  } catch (error) {
    unsetAuthenticationCookie(context);
    throw error;
  }
}

export default verifyAuthorizationHeader;
