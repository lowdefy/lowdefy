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

import addUserFieldsToToken from './addUserFieldsToToken.js';
import createCallbackPlugins from './createCallbackPlugins.js';

function createJWTCallback({ authConfig, logger, plugins }) {
  const jwtCallbackPlugins = createCallbackPlugins({
    authConfig,
    plugins,
    type: 'jwt',
  });

  async function jwtCallback({ token, user, account, profile, isNewUser }) {
    if (profile) {
      const {
        id,
        sub,
        name,
        given_name,
        family_name,
        middle_name,
        nickname,
        preferred_username,
        profile: profile_claim,
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
      } = profile;
      token = {
        id,
        sub,
        name,
        given_name,
        family_name,
        middle_name,
        nickname,
        preferred_username,
        profile: profile_claim,
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
        ...token,
      };
    }

    if (profile || user) {
      if (authConfig.userFields) {
        addUserFieldsToToken({ authConfig, account, logger, profile, token, user });
      }
    }

    for (const plugin of jwtCallbackPlugins) {
      token = await plugin.fn({
        properties: plugin.properties ?? {},
        account,
        isNewUser,
        profile,
        token,
        user,
      });
    }

    return token;
  }
  return jwtCallback;
}

export default createJWTCallback;
