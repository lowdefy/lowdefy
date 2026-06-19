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

import createPrefixedCookies, { slugifyPrefix } from './createPrefixedCookies.js';

// Cookie name resolution, in order of precedence:
//   1. An explicit `auth.advanced.cookies` object is used verbatim.
//   2. An explicit `auth.advanced.cookiePrefix` namespaces cookie names (dev and prod).
//   3. When running the dev server, derive a prefix from the app slug/name so multiple
//      apps on localhost do not share a cookie jar (browsers do not scope cookies by
//      port). Production is left untouched, returning undefined for NextAuth defaults.
function resolveCookies({ appMeta, authConfig, dev }) {
  const explicitCookies = authConfig?.advanced?.cookies;
  if (!type.isNone(explicitCookies)) return explicitCookies;

  const devPrefix = dev ? slugifyPrefix(appMeta?.slug ?? appMeta?.name ?? '') : '';
  const prefix = authConfig?.advanced?.cookiePrefix ?? (devPrefix === '' ? undefined : devPrefix);
  if (type.isNone(prefix) || prefix === '') return undefined;

  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
  return createPrefixedCookies({ prefix, useSecureCookies });
}

export default resolveCookies;
