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

import createCallbackPlugins from './createCallbackPlugins.js';

function createJWTCallback({ authConfig, plugins }) {
  const jwtCallbackPlugins = createCallbackPlugins({
    authConfig,
    plugins,
    type: 'jwt',
  });

  if (jwtCallbackPlugins.length === 0) return undefined;

  async function jwtCallback({ token, user, account, profile, isNewUser }) {
    for (const plugin of jwtCallbackPlugins) {
      token = await plugin.fn({
        properties: plugin.properties ?? {},
        token,
        user,
        account,
        profile,
        isNewUser,
      });
    }

    return token;
  }
  return jwtCallback;
}

export default createJWTCallback;
