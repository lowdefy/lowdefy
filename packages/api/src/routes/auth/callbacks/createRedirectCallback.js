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

import createCallbackPlugins from './createCallbackPlugins.js';

function createRedirectCallback({ authConfig, plugins }) {
  const redirectCallbackPlugins = createCallbackPlugins({
    authConfig,
    plugins,
    type: 'redirect',
  });

  if (redirectCallbackPlugins.length === 0) return undefined;

  if (redirectCallbackPlugins.length !== 1) {
    throw new Error('More than one auth redirect callbacks are configured. Only one is allowed.');
  }
  const [plugin] = redirectCallbackPlugins;

  async function redirectCallback({ url, baseUrl }) {
    return plugin.fn({
      properties: plugin.properties ?? {},
      baseUrl,
      url,
    });
  }
  return redirectCallback;
}

export default createRedirectCallback;
