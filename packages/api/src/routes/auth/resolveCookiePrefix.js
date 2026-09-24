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

function slugifyPrefix(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Lowdefy sets the cookie name prefix - it is not app-configurable. In dev,
// the prefix is derived from the app so multiple local apps on different
// ports do not collide on cookies (browsers do not scope cookies by port).
function resolveCookiePrefix({ appMeta, dev }) {
  if (dev) {
    const appIdentifier = appMeta?.slug ?? appMeta?.name;
    if (appIdentifier) {
      return `lowdefy-${slugifyPrefix(appIdentifier)}`;
    }
  }
  return 'lowdefy';
}

export default resolveCookiePrefix;
