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

// The page cache in SQLite: per cache key (getCacheKey), the mobile root with its ETag and the
// caller, and each page with its index hash and ETag. All of it is the server's answers kept as
// JSON; nothing here is shared between callers.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS roots (
  cache_key TEXT PRIMARY KEY NOT NULL,
  root TEXT NOT NULL,
  root_etag TEXT,
  user TEXT
);
CREATE TABLE IF NOT EXISTS pages (
  cache_key TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page TEXT NOT NULL,
  PRIMARY KEY (cache_key, page_id)
);
`;

/**
 * @param {Object} params
 * @param {Object} params.db An expo-sqlite database (openDatabaseSync).
 */
function createSqliteCacheStore({ db }) {
  let ready = null;
  function init() {
    if (ready === null) {
      ready = db.execAsync(SCHEMA);
    }
    return ready;
  }

  return {
    async read(cacheKey) {
      await init();
      const row = await db.getFirstAsync(
        'SELECT root, root_etag, user FROM roots WHERE cache_key = ?',
        [cacheKey]
      );
      if (row === null) {
        return null;
      }
      const pageRows = await db.getAllAsync('SELECT page_id, page FROM pages WHERE cache_key = ?', [
        cacheKey,
      ]);
      return {
        root: JSON.parse(row.root),
        rootEtag: row.root_etag,
        user: JSON.parse(row.user),
        pages: Object.fromEntries(pageRows.map((page) => [page.page_id, JSON.parse(page.page)])),
      };
    },
    async writeRoot({ cacheKey, entry }) {
      await init();
      await db.runAsync(
        'INSERT OR REPLACE INTO roots (cache_key, root, root_etag, user) VALUES (?, ?, ?, ?)',
        [cacheKey, JSON.stringify(entry.root), entry.rootEtag ?? null, JSON.stringify(entry.user)]
      );
    },
    async writePage({ cacheKey, pageId, page }) {
      await init();
      await db.runAsync(
        'INSERT OR REPLACE INTO pages (cache_key, page_id, page) VALUES (?, ?, ?)',
        [cacheKey, pageId, JSON.stringify(page)]
      );
    },
    // One caller's cache: an organisation that refused the person.
    async removeEntry({ cacheKey }) {
      await init();
      await db.runAsync('DELETE FROM roots WHERE cache_key = ?', [cacheKey]);
      await db.runAsync('DELETE FROM pages WHERE cache_key = ?', [cacheKey]);
    },
    // Every caller's cache of one app (getCacheKey starts each key with the app id): sign-out.
    async removeApp({ appId }) {
      await init();
      const prefix = `${appId}:`;
      await db.runAsync('DELETE FROM roots WHERE substr(cache_key, 1, length(?)) = ?', [
        prefix,
        prefix,
      ]);
      await db.runAsync('DELETE FROM pages WHERE substr(cache_key, 1, length(?)) = ?', [
        prefix,
        prefix,
      ]);
    },
    async removePages({ cacheKey, pageIds }) {
      await init();
      for (const pageId of pageIds) {
        await db.runAsync('DELETE FROM pages WHERE cache_key = ? AND page_id = ?', [
          cacheKey,
          pageId,
        ]);
      }
    },
  };
}

export default createSqliteCacheStore;
