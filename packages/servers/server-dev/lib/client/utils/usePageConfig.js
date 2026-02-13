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
  if (!res.ok) {
    throw new Error(data.message || 'Request error');
  }

  // Fetch jsMap after page build completes (JIT build may have added new entries).
  // Extract basePath from the URL to construct the jsMap endpoint.
  const basePath = url.replace(/\/api\/page\/.*$/, '');
  const jsEntries = await fetchJsEntries(basePath);
  data._jsEntries = jsEntries;

  return data;
}

function usePageConfig(pageId, basePath) {
  const url = `${basePath}/api/page/${pageId}`;
  // Include reloadVersion in the SWR key so that after a config reload,
  // previously cached page data is not reused. The fetcher receives
  // [url, version] but only uses url — the version just busts the cache.
  const { data } = useSWR([url, getReloadVersion()], ([fetchUrl]) => fetchPageConfig(fetchUrl), {
    suspense: true,
  });
  return { data };
}

export default usePageConfig;
