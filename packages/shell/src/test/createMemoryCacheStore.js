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

// The page cache held in memory, with the same methods as createSqliteCacheStore.
function createMemoryCacheStore() {
  const roots = new Map();
  const pages = new Map();
  function pagesOf(cacheKey) {
    if (!pages.has(cacheKey)) pages.set(cacheKey, new Map());
    return pages.get(cacheKey);
  }
  return {
    roots,
    pages,
    async read(cacheKey) {
      if (!roots.has(cacheKey)) return null;
      return {
        ...structuredClone(roots.get(cacheKey)),
        pages: Object.fromEntries(structuredClone([...pagesOf(cacheKey).entries()])),
      };
    },
    async writeRoot({ cacheKey, entry }) {
      roots.set(cacheKey, structuredClone(entry));
    },
    async writePage({ cacheKey, pageId, page }) {
      pagesOf(cacheKey).set(pageId, structuredClone(page));
    },
    async removeEntry({ cacheKey }) {
      roots.delete(cacheKey);
      pages.delete(cacheKey);
    },
    async removeApp({ appId }) {
      [...roots.keys(), ...pages.keys()]
        .filter((cacheKey) => cacheKey.startsWith(`${appId}:`))
        .forEach((cacheKey) => {
          roots.delete(cacheKey);
          pages.delete(cacheKey);
        });
    },
    async removePages({ cacheKey, pageIds }) {
      pageIds.forEach((pageId) => pagesOf(cacheKey).delete(pageId));
    },
  };
}

export default createMemoryCacheStore;
