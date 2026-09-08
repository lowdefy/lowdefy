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

import useSWR from 'swr';

import { getNavVersion, getReloadVersion } from './useMutateCache.js';

// URLs whose config is server-resolved per request — learned from the fetched
// config's dynamic flag, so the first visit caches like a static page and
// every later navigation refetches.
const dynamicUrls = new Set();

function parseJsModule(text) {
  const fn = new Function('exports', text.replace('export default', 'exports.default ='));
  const mod = {};
  fn(mod);
  return mod.default ?? {};
}

export async function fetchPageConfig(url) {
  // A stalled request (server restart mid-request, exhausted sockets) must
  // become a visible error, never an eternal Suspense fallback — the reload
  // recovery path cannot fire while the page tree is suspended.
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error(
        `Page config request "${url}" timed out - the dev server may be restarting. Reload the page.`
      );
    }
    throw error;
  }
  if (res.status === 404) {
    return null;
  }
  const data = await res.json();
  if (data?.buildError) {
    return data;
  }
  if (data?.installing) {
    return data;
  }
  if (!res.ok) {
    throw new Error(data.message || 'Request error');
  }

  // The JIT build folds this page's _js entries and dynamic icons into the
  // response, so first paint needs no secondary fetch. _jsEntries arrives as
  // module text — compile it to the { hash: fn } object Page expects.
  // _dynamicIcons is already plain data — leave it for Page to inject.
  if (data._jsEntries) data._jsEntries = parseJsModule(data._jsEntries);

  if (data?.dynamic === true) {
    dynamicUrls.add(url);
  }

  return data;
}

function usePageConfig(pageId, basePath) {
  // Forward the current query string so server-side Dynamic block resolution
  // sees the same urlQuery as an initial HTML load. Including it in the SWR
  // key also caches dynamic pages per query string.
  const url = `${basePath}/api/page/${pageId}${window.location.search}`;
  // Include reloadVersion in the SWR key so that after a config reload,
  // previously cached page data is not reused. Dynamic pages also key on the
  // navigation version — server-resolved content must re-resolve on every
  // navigation, never serve from the SWR cache. The fetcher receives
  // [url, ...versions] but only uses url — the versions just bust the cache.
  const navVersion = dynamicUrls.has(url) ? getNavVersion() : 0;
  const { data } = useSWR(
    [url, getReloadVersion(), navVersion],
    ([fetchUrl]) => fetchPageConfig(fetchUrl),
    {
      suspense: true,
    }
  );
  return { data };
}

export default usePageConfig;
