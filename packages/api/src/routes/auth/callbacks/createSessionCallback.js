/*
  Copyright 2020-2024 Lowdefy, Inc

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

import crypto from 'crypto';

import addUserFieldsToSession from './addUserFieldsToSession.js';
import createCallbackPlugins from './createCallbackPlugins.js';

function createSessionCallback({ authConfig, plugins }) {
  const sessionCallbackPlugins = createCallbackPlugins({
    authConfig,
    plugins,
    type: 'session',
  });

  async function sessionCallback({ session, token, user }) {
    const identifier = user
      ? user.id ?? user.sub ?? user.email
      : token.id ?? token.sub ?? token.email;
    if (token) {
      const {
        id,
        sub,
        name,
        given_name,
        family_name,
        middle_name,
        nickname,
        preferred_username,
        profile,
        picture,
        website,
        email,
        email_verified,
        gender,
        birthdate,
        zoneinfo,
        locale,
        phone_number,
        phone_number_verified,
        address,
        updated_at,
      } = token;
      session.user = {
        id,
        sub,
        name,
        given_name,
        family_name,
        middle_name,
        nickname,
        preferred_username,
        profile,
        picture,
        website,
        email,
        email_verified,
        gender,
        birthdate,
        zoneinfo,
        locale,
        phone_number,
        phone_number_verified,
        address,
        updated_at,
        ...session.user,
      };
    }

    if (authConfig.userFields) {
      addUserFieldsToSession({ authConfig, session, token, user });
    }

    for (const plugin of sessionCallbackPlugins) {
      // eslint-disable-next-line no-param-reassign
      session = await plugin.fn({
        properties: plugin.properties ?? {},
        session,
        token,
        user,
      });
    }

    // TODO: Should this be session.hashed_id or session.user.hashed_id
    // Only session.user will be available using the _user operator
    session.hashed_id = crypto
      .createHash('sha256')
      .update(identifier ?? '')
      .digest('base64');

    return session;
  }
  return sessionCallback;
}

export default createSessionCallback;
