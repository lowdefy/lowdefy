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

import shouldReloadForBuild from '@lowdefy/client/shouldReloadForBuild.js';

// fetch for the auth client and /api/user. When an auth call fails and the
// server's x-lowdefy-build (src/middleware/stampBuildId.js) shows a newer build
// answered, the route may have been renamed or removed since this bundle
// loaded, so the tab reloads once onto the current build. The promise never
// settles: the page is unloading, and a rejection would surface as an auth
// error. A successful call from a newer build carries on; the next navigation
// reloads the tab (client/Page.jsx). buildId is the build this bundle was made
// from.
function createFetchCheckingBuild({ buildId }) {
  return async function fetchCheckingBuild(input, init) {
    const response = await fetch(input, init);
    if (
      !response.ok &&
      shouldReloadForBuild({
        bundleBuildId: buildId,
        serverBuildId: response.headers.get('x-lowdefy-build'),
        window,
      })
    ) {
      window.location.reload();
      return new Promise(() => {});
    }
    return response;
  };
}

export default createFetchCheckingBuild;
