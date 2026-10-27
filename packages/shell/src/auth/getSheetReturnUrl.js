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

/**
 * Where the sign-in sheet returns to the shell with its one-time token: on iOS the shell's scheme,
 * <scheme>://auth, which ASWebAuthenticationSession hands only to the app that opened the sheet;
 * on Android the app's https app link, <app url>/auth/mobile/callback, which Android opens only in
 * the shell the app's assetlinks.json names (app.config.ts declares it, authCallbackIntentFilters).
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {'ios'|'android'} params.platform
 * @param {{ scheme }} params.shell The shell config.
 */
function getSheetReturnUrl({ apiBase, platform, shell }) {
  if (platform === 'android') {
    return `${apiBase.replace(/\/$/, '')}/auth/mobile/callback`;
  }
  return `${shell.scheme}://auth`;
}

export default getSheetReturnUrl;
