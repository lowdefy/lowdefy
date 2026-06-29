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

import useSWR, { preload } from 'swr';

import { getReloadVersion } from './useMutateCache.js';

function parseJsModule(text) {
  const fn = new Function('exports', text.replace('export default', 'exports.default ='));
  const mod = {};
  fn(mod);
  return mod.default ?? {};
}

async function fetchJsEntries(basePath) {
  try {
    const res = await fetch(`${basePath}/api/js/client`);
    if (!res.ok) return {};
    return parseJsModule(await res.text());
  } catch {
    return {};
  }
}

async function fetchDynamicIcons(basePath) {
  try {
    const res = await fetch(`${basePath}/api/icons/dynamic`);
    if (!res.ok) return {};
    return parseJsModule(await res.text());
  } catch {
    return {};
  }
}

async function fetchPageConfig(url) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
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

  // Fetch jsMap and dynamic icons after page build completes
  // (JIT build may have added new entries).
  // Extract basePath from the URL to construct the endpoints.
  const basePath = url.replace(/\/api\/page\/.*$/, '');
  const [jsEntries, dynamicIcons] = await Promise.all([
    fetchJsEntries(basePath),
    fetchDynamicIcons(basePath),
  ]);
  data._jsEntries = jsEntries;
  data._dynamicIcons = dynamicIcons;

  return data;
}

// SWR key + fetcher shared by usePageConfig and prefetchPageConfig, so a
// prefetch-on-hover populates the exact cache entry the navigation read uses.
// Include reloadVersion in the key so that after a config reload, previously
// cached page data is not reused. The fetcher receives [url, version] but only
// uses url — the version just busts the cache.
function pageConfigKey(pageId, basePath) {
  return [`${basePath}/api/page/${pageId}`, getReloadVersion()];
}

const pageConfigFetcher = ([fetchUrl]) => fetchPageConfig(fetchUrl);

function usePageConfig(pageId, basePath) {
  const { data } = useSWR(pageConfigKey(pageId, basePath), pageConfigFetcher, {
    suspense: true,
  });
  return { data };
}

// Warm the SWR cache for a page (Link hover/focus) so the subsequent
// navigation read resolves from cache instead of suspending on a fetch.
function prefetchPageConfig(pageId, basePath) {
  return preload(pageConfigKey(pageId, basePath), pageConfigFetcher);
}

export default usePageConfig;
export { prefetchPageConfig };
