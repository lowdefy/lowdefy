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

// The Android app link the sign-in sheet returns by: the app server sends the one-time token to
// https://<app domain><basePath>/auth/mobile/callback, and Android opens that link only in the
// shell the app's assetlinks.json names (autoVerify), never in another app. A shell opens one app
// (checkShellConfig), so there is one filter, at the app's url for the shell's environment.
// Android verifies https links only, so an http url (a local dev server) gets none.
function getAuthCallbackIntentFilters({ shell }) {
  const url = shell.app.urls[shell.environment];
  if (!url.startsWith('https://')) {
    return [];
  }
  const { hostname, pathname, port } = new URL(url);
  const data = {
    scheme: 'https',
    host: hostname,
    pathPrefix: `${pathname.replace(/\/$/, '')}/auth/mobile/callback`,
  };
  if (port !== '') {
    data.port = port;
  }
  return [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [data],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ];
}

module.exports = { getAuthCallbackIntentFilters };
