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

import { buildPagePath } from '@lowdefy/helpers';

// The path to fetch for a router location ({ path, pathname, search }, path ''
// at the app root). The app root shows the home page, at its own path: a
// configured homePageId is served at the root, and an app without one
// redirects there.
function getPagePath(location, rootConfig) {
  if (location.path !== '') {
    return { redirect: false, path: location.path };
  }
  const { home, pagePaths } = rootConfig;
  const path = buildPagePath({
    pageId: home.pageId,
    path: pagePaths[home.pageId],
    pathParams: home.pathParams,
  });
  return { redirect: home.configured === false, path };
}

export default getPagePath;
