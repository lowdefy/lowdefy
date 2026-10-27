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

// The host excludes "@" and a backslash: a URL with userinfo (http://localhost@evil.example)
// names a different host than its text starts with, and would pass for a loopback server.
const SERVER_URL = /^(https?):\/\/([^/\\?#\s@]+)(\/[^?#\s]*)?$/i;

/**
 * A dev server's URL as Lowdefy Dev keeps it: `{ url, host }`, the url without a trailing slash,
 * or null when it is not an http(s) URL. A bare `host:port` is read as http, the way lowdefy dev
 * serves.
 */
function parseServerUrl(input) {
  if (!type.isString(input)) {
    return null;
  }
  const trimmed = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const match = SERVER_URL.exec(withScheme);
  if (match === null) {
    return null;
  }
  const [, scheme, host, pathname = ''] = match;
  return {
    url: `${scheme.toLowerCase()}://${host}${pathname.replace(/\/+$/, '')}`,
    host,
  };
}

export default parseServerUrl;
