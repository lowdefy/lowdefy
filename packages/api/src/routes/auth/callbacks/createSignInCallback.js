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

import createCallbackPlugins from './createCallbackPlugins.js';

function createSignInCallback({ authConfig, plugins }) {
  const signInCallbackPlugins = createCallbackPlugins({
    authConfig,
    plugins,
    type: 'signIn',
  });

  if (signInCallbackPlugins.length === 0) return undefined;

  async function signInCallback({ account, credentials, email, profile, user }) {
    let allowSignIn = true;
    for (const plugin of signInCallbackPlugins) {
      allowSignIn = await plugin.fn({
        properties: plugin.properties ?? {},
        account,
        credentials,
        email,
        profile,
        user,
      });
      if (allowSignIn === false) break;
    }

    return allowSignIn;
  }
  return signInCallback;
}

export default createSignInCallback;
