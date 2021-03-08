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

async function verifyAccessToken({ development, headers, getController, setHeader }) {
  const cookieHeader = get(headers, 'Cookie') || get(headers, 'cookie') || '';

  const { authorization } = cookie.parse(cookieHeader);
  if (!authorization) return {};
  const tokenController = getController('token');
  try {
    const {
      iat,
      exp,
      aud,
      iss,
      lowdefy_access_token,
      ...user
    } = await tokenController.verifyAccessToken(authorization);
    return user;
  } catch (error) {
    const setCookieHeader = cookie.serialize('authorization', '', {
      httpOnly: true,
      path: '/api/graphql',
      sameSite: 'lax',
      secure: !development,
      maxAge: 0,
    });
    setHeader('Set-Cookie', setCookieHeader);
    throw error;
  }
}

export default verifyAccessToken;
