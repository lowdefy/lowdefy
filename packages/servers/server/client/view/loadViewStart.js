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

import getFetchPath from '../getFetchPath.js';
import getShownPage from '../getShownPage.js';
import fetchViewPage from './fetchViewPage.js';

async function fetchJson({ host, path }) {
  const response = await host.view.fetchApi(path);
  if (!response.ok) {
    throw new Error(`The app answered ${response.status} to ${path}.`);
  }
  return response.json();
}

// Everything a view needs before its first render, for the page at the
// router's location and the caller the view's session is for: the root config
// (/api/view/root), the user (/api/user) and the page with its plugin code
// (/api/page). The browser entry reads the same three from the server's HTML.
// It runs again when the app answers as another caller.
//
// A page that comes from another build than this bundle is not shown: its
// config can name plugins and _js functions this bundle does not carry. The
// answer is then { newBuild: true } with no page.
async function loadViewStart({ bundleBuildId, host, loadPageTypes }) {
  const { path, search } = host.router.getLocation();
  const [rootConfig, { user }] = await Promise.all([
    fetchJson({ host, path: '/api/view/root' }),
    fetchJson({ host, path: '/api/user' }),
  ]);
  const fetched = await fetchViewPage({
    fetchPath: getFetchPath({ path, rootConfig }),
    host,
    search,
  });
  if (!fetched.shown) {
    throw new Error(`The app answered ${fetched.status} for the page of this view.`);
  }
  if (fetched.response.buildId !== bundleBuildId) {
    return { newBuild: true, page: null, rootConfig, user };
  }
  await loadPageTypes({ pageConfig: fetched.response.pageConfig });
  return {
    newBuild: false,
    page: getShownPage({ path, response: fetched.response }),
    rootConfig,
    user,
  };
}

export default loadViewStart;
