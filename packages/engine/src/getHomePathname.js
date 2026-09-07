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

// The single reading of `lowdefy.home` for every 'home' target - the Link
// grammar in createLink and the post-auth callbackUrl ladder in the client both
// resolve through here. Returns undefined when the app names no home page:
// getHomeAndMenus resolves pageId to null for an app with no homePageId whose
// authorized menu yields no link, and each caller decides what no-home means
// for it (an invalid link, no callback target) rather than interpolating the
// missing value into a path.
function getHomePathname({ lowdefy }) {
  // A configured homePageId is served at the app root - the server resolves `/`
  // to that page, so the pageId is deliberately not in the path.
  if (lowdefy.home?.configured === true) {
    return '/';
  }
  if (type.isString(lowdefy.home?.pageId)) {
    return `/${lowdefy.home.pageId}`;
  }
  return undefined;
}

export default getHomePathname;
