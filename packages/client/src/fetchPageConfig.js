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

// Page config fetcher for SPA navigation, used both as the SWR fetcher for
// prefetch-on-hover and for the navigation fetch. The key IS the request url,
// so the same SWR cache entry is shared by prefetch and navigation.
//
// A missing page resolves to { pageConfig: null } (not a throw) so the caller
// routes to /404 in-app; only genuine network failures reject, triggering the
// caller's full-page-load fallback. The returned config stays in serialized
// form — Client deserializes it (and prewarmPageContext deserializes a copy).

function pageConfigKey(basePath, pageId) {
  return `${basePath}/api/page/${pageId}`;
}

async function fetchPageConfig(url) {
  const res = await fetch(url);
  if (!res.ok) {
    return { pageConfig: null };
  }
  return res.json();
}

export default fetchPageConfig;
export { pageConfigKey };
