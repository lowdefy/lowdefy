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

import { serializer, type } from '@lowdefy/helpers';

import { getNavVersion, getReloadVersion } from './useMutateCache.js';

// Page config URLs (without the query string) of pages whose config is
// server-resolved per request, mapped to the navigation version of the fetch
// that found them dynamic. Learned from the fetched config's dynamic flag.
const dynamicPages = new Map();

function parseJsModule(text) {
  const fn = new Function('exports', text.replace('export default', 'exports.default ='));
  const mod = {};
  fn(mod);
  return mod.default ?? {};
}

export async function fetchPageConfig(url) {
  const basePath = url.replace(/\/api\/page\/.*$/, '');
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
  if (res.status === 401 || res.status === 403) {
    // 401: logged-out navigation to a protected page. 403: authorised but second
    // factor not yet enrolled. Page renders a redirect screen and full-loads to
    // the destination so it can return here afterwards. Returning a settled value
    // (never a parked promise) keeps the SWR key healthy: if the navigation is
    // dropped, the tab still recovers on the next reload event or via the manual
    // link on the redirect screen.
    const { redirect } = await res.json();
    const authRedirect = redirect ?? `${basePath}/404`;
    console.warn(
      `Lowdefy dev: "${url}" returned ${res.status} - redirecting to "${authRedirect}".`
    );
    return { authRedirect };
  }
  const data = await res.json();
  if (data?.buildError) {
    return data;
  }
  if (data?.installing) {
    return data;
  }
  if (!res.ok) {
    // A Lowdefy error envelope is revived rather than flattened to its message,
    // so the class, configKey and source survive to the error handler.
    if (data?.['~e']) {
      throw serializer.deserialize(data);
    }
    throw new Error(data.message || 'Request error');
  }

  // The JIT build folds this page's _js entries and dynamic icons into the
  // response, so first paint needs no secondary fetch. _jsEntries arrives as
  // module text — compile it to the { hash: fn } object Page expects.
  // _dynamicIcons is already plain data — leave it for Page to inject.
  if (data._jsEntries) data._jsEntries = parseJsModule(data._jsEntries);

  return data;
}

export function recordDynamicPage({ data, pageUrl }) {
  if (data?.dynamic !== true) {
    dynamicPages.delete(pageUrl);
    return;
  }
  // Keep the first navigation version: later fetches of a known dynamic page
  // must not move it, or their key would fall back to the static key.
  if (!dynamicPages.has(pageUrl)) {
    dynamicPages.set(pageUrl, getNavVersion());
  }
}

// The query string only changes the config of a dynamic page (server-side
// Dynamic block resolution reads urlQuery), so a static page keys on its URL
// alone and a Link that only changes the query reuses the cached config instead
// of suspending behind the Building page fallback. A dynamic page keys on the
// query and the navigation version, so it re-resolves on every navigation.
// reloadVersion orphans every cached entry after a config reload. The fetch
// that first finds a page dynamic was made under the static key, so for the
// rest of that navigation the page keeps the static key and uses that result
// rather than fetching it again.
export function getPageConfigKey({ pageUrl, search }) {
  const foundAtNavVersion = dynamicPages.get(pageUrl);
  const navVersion = getNavVersion();
  if (type.isUndefined(foundAtNavVersion) || foundAtNavVersion === navVersion) {
    return [pageUrl, getReloadVersion()];
  }
  return [pageUrl, getReloadVersion(), search, navVersion];
}

function usePageConfig(pageId, basePath) {
  const pageUrl = `${basePath}/api/page/${pageId}`;
  const search = window.location.search;
  // The fetch always forwards the current query string, so server-side Dynamic
  // block resolution sees the same urlQuery as an initial HTML load.
  const { data } = useSWR(
    getPageConfigKey({ pageUrl, search }),
    async () => {
      const pageConfig = await fetchPageConfig(`${pageUrl}${search}`);
      recordDynamicPage({ data: pageConfig, pageUrl });
      return pageConfig;
    },
    {
      suspense: true,
    }
  );
  return { data };
}

export default usePageConfig;
