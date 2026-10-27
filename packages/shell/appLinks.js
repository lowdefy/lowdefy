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

// The app's links that open in the shell: https links to any page of the app (universal links on
// iOS, verified app links on Android). The server's apple-app-site-association and assetlinks.json
// name the shell for every page path under basePath and leave /api to the server; the shell
// declares the domain (iOS) and the host and path prefix (Android) of its app's url for its
// environment. Both platforms verify https links only, so an http url (a local dev server) gets
// none.
function getAppUrl({ shell }) {
  const url = shell.app.urls[shell.environment];
  if (!url.startsWith('https://')) {
    return null;
  }
  return new URL(url);
}

// iOS: the Associated Domains entitlement, `applinks:<host>` (with its port when it has one).
function getAssociatedDomains({ shell }) {
  const url = getAppUrl({ shell });
  if (url === null) {
    return [];
  }
  return [`applinks:${url.host}`];
}

// Android: one autoVerify filter for the app's host under its basePath. The sign-in callback has its
// own filter (authCallbackIntentFilters.js); the router hands that path to the sign-in sheet.
function getAppLinkIntentFilters({ shell }) {
  const url = getAppUrl({ shell });
  if (url === null) {
    return [];
  }
  const basePath = url.pathname.replace(/\/$/, '');
  const data = { scheme: 'https', host: url.hostname };
  if (basePath !== '') {
    data.pathPrefix = basePath;
  }
  if (url.port !== '') {
    data.port = url.port;
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

module.exports = { getAppLinkIntentFilters, getAssociatedDomains };
