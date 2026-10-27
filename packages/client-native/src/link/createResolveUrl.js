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

const schemePattern = /^[a-z][a-z0-9+.-]*:/i;
const originPattern = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i;

/**
 * `components.resolveUrl`: a url as a browser on the app's page would read it, for blocks that
 * load or open a url a config wrote for the web, such as a Markdown image `/public/logo.png`. A
 * phone has no page origin, so a path is taken against the app server's url (apiBase): one from
 * the root (`/public/logo.png`) on its origin, any other (`logo.png`) under it. A url with a
 * scheme (`https:`, `mailto:`, `data:`) is left as it is, and one from `//` takes the server's
 * scheme.
 *
 * @param {Object} lowdefy The app-level lowdefy object, after createLowdefyCore.
 * @returns {(url: string) => string}
 */
function createResolveUrl(lowdefy) {
  return function resolveUrl(url) {
    if (!type.isString(url) || url === '' || schemePattern.test(url)) {
      return url;
    }
    const base = lowdefy.apiBase ?? '';
    const origin = originPattern.exec(base)?.[0];
    if (origin === undefined) {
      return url;
    }
    if (url.startsWith('//')) {
      return `${origin.slice(0, origin.indexOf(':') + 1)}${url}`;
    }
    if (url.startsWith('/')) {
      return `${origin}${url}`;
    }
    return `${base.replace(/\/+$/, '')}/${url}`;
  };
}

export default createResolveUrl;
