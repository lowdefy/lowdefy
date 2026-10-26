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

import { type } from '@lowdefy/helpers';

// The scheme and authority, everything up to the first `/`, `?` or `#`, so any user info, port
// or extra label stays in it and a lookalike (`https://app.test.evil.com`,
// `https://app.test@evil.com`) never equals the app server's origin.
const originPattern = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i;

/**
 * A url's origin in lower case, for an exact comparison of two; undefined when it has none (a
 * path, a `data:` uri).
 *
 * @param {string} url
 * @returns {string|undefined}
 */
function getUrlOrigin(url) {
  if (!type.isString(url)) {
    return undefined;
  }
  return originPattern.exec(url)?.[0].toLowerCase();
}

export default getUrlOrigin;
