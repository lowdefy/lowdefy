/*
  Copyright 2020-2023 Lowdefy, Inc

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

import createEventPlugins from './createEventPlugins.js';

function createSignOutEvent({ authConfig, logger, plugins }) {
  const signOutPlugins = createEventPlugins({
    authConfig,
    plugins,
    type: 'signOut',
  });

  async function signOutEvent({ session, token }) {
    console.log({ session, token });
    // logger.info({
    //   event: 'auth_sign_out',
    //   user: session.user,
    // });
    for (const plugin of signOutPlugins) {
      await plugin.fn({
        properties: plugin.properties ?? {},
        session,
        token,
      });
    }
  }
  return signOutEvent;
}

export default createSignOutEvent;
