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

import parseOrigin from './parseOrigin.js';
import parsePath from './parsePath.js';

/**
 * A `window.location` for a native host: the route `getPath` gives, on the app's origin, read each
 * time it is asked for.
 *
 * @param {Object} params
 * @param {(url: string) => void} params.assign Opens a URL, for `location.assign` (auth flows).
 * @param {() => string} params.getPath The route: path, query string and hash.
 * @param {string} params.origin The app server's origin, such as 'https://app.example.com'.
 */
function createNativeLocation({ assign, getPath, origin }) {
  return {
    ...parseOrigin(origin),
    assign,
    get hash() {
      return parsePath(getPath()).hash;
    },
    get href() {
      return `${origin}${getPath()}`;
    },
    origin,
    get pathname() {
      return parsePath(getPath()).pathname;
    },
    get search() {
      return parsePath(getPath()).search;
    },
  };
}

export default createNativeLocation;
