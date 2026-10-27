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

import { getAuthorizationHeaders } from '@lowdefy/client-core';
import { type } from '@lowdefy/helpers';

import createResolveUrl from './createResolveUrl.js';
import getUrlOrigin from './getUrlOrigin.js';

/**
 * `components.imageSource`: the expo-image source for a url a config wrote for the web, such as
 * a Markdown image or an avatar photo. The url is taken as resolveUrl takes it. On the web an
 * image on the app server loads with the session cookie; a phone has no cookie, so an image on
 * the app server's own origin carries the session token as a bearer header, and an image behind
 * the app's sign-in loads. No other origin ever gets the token.
 *
 * @param {Object} lowdefy The app-level lowdefy object, after createLowdefyCore.
 * @returns {(url: string) => { uri: string, headers?: Object }}
 */
function createImageSource(lowdefy) {
  const resolveUrl = createResolveUrl(lowdefy);
  return function imageSource(url) {
    const uri = resolveUrl(url);
    const apiOrigin = getUrlOrigin(lowdefy.apiBase);
    if (apiOrigin === undefined || getUrlOrigin(uri) !== apiOrigin) {
      return { uri };
    }
    const headers = getAuthorizationHeaders({ host: lowdefy._internal.host });
    if (type.isNone(headers.Authorization)) {
      return { uri };
    }
    return { uri, headers };
  };
}

export default createImageSource;
