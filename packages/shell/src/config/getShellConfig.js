/*
  Copyright 2020-2026 Lowdefy, Inc

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

import Constants from 'expo-constants';

import typeManifest from '../plugins/typeManifest.js';

/**
 * The shell's config: shell.json as app.config.ts built it into the app (`id`, `name`,
 * `profile`, `scheme`, `environment`, `store` and the one app it opens,
 * `app: { id, name, urls: { <env>: url } }`, checked by checkShellConfig.js) with the shell's
 * `version`, and the `typeManifest` of the JavaScript that is running. An embedded launch reads the
 * Expo config the native build embedded, so the manifest comes from the bundle instead: a type
 * added to the plugin maps then reaches the shell from Metro or by an over-the-air update.
 */
function getShellConfig() {
  return { ...Constants.expoConfig.extra.shell, typeManifest };
}

export default getShellConfig;
