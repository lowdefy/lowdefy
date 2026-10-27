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

import { jest } from '@jest/globals';

import createSqliteCacheStore from './createSqliteCacheStore.js';

// A stand-in for an expo-sqlite database over the two tables the store uses.
function createFakeDb() {
  const roots = new Map();
  const pages = new Map();
  return {
    execAsync: jest.fn(async () => undefined),
    getFirstAsync: jest.fn(async (sql, [cacheKey]) => roots.get(cacheKey) ?? null),
    getAllAsync: jest.fn(async (sql, [cacheKey]) =>
      [...pages.values()].filter((row) => row.cache_key === cacheKey)
    ),
    runAsync: jest.fn(async (sql, params) => {
      if (sql.startsWith('INSERT OR REPLACE INTO roots')) {
        const [cacheKey, root, rootEtag, user] = params;
        roots.set(cacheKey, { root, root_etag: rootEtag, user });
      } else if (sql.startsWith('INSERT OR REPLACE INTO pages')) {
        const [cacheKey, pageId, page] = params;
        pages.set(`${cacheKey}|${pageId}`, { cache_key: cacheKey, page_id: pageId, page });
      } else if (sql.startsWith('DELETE FROM roots WHERE cache_key')) {
        roots.delete(params[0]);
      } else if (sql.startsWith('DELETE FROM pages WHERE cache_key = ? AND')) {
        pages.delete(`${params[0]}|${params[1]}`);
      } else if (sql.startsWith('DELETE FROM pages WHERE cache_key')) {
        [...pages.keys()]
          .filter((key) => pages.get(key).cache_key === params[0])
          .forEach((key) => pages.delete(key));
      } else if (sql.startsWith('DELETE FROM roots WHERE substr')) {
        [...roots.keys()]
          .filter((key) => key.startsWith(params[1]))
          .forEach((key) => roots.delete(key));
      } else if (sql.startsWith('DELETE FROM pages WHERE substr')) {
        [...pages.keys()]
          .filter((key) => pages.get(key).cache_key.startsWith(params[1]))
          .forEach((key) => pages.delete(key));
      }
    }),
  };
}

test('the SQLite cache keeps a root and its pages per cache key', async () => {
  const db = createFakeDb();
  const store = createSqliteCacheStore({ db });
  expect(await store.read('field:c1:r1')).toBeNull();
  await store.writeRoot({
    cacheKey: 'field:c1:r1',
    entry: { root: { homePageId: 'today' }, rootEtag: '"r1"', user: { id: 'u1' } },
  });
  await store.writePage({ cacheKey: 'field:c1:r1', pageId: 'today', page: { hash: 'h1' } });
  await store.writePage({ cacheKey: 'field:c1:r1', pageId: 'jobs', page: { hash: 'h2' } });
  await store.writePage({ cacheKey: 'field:c2:r1', pageId: 'today', page: { hash: 'other' } });
  await store.removePages({ cacheKey: 'field:c1:r1', pageIds: ['jobs'] });
  expect(await store.read('field:c1:r1')).toEqual({
    root: { homePageId: 'today' },
    rootEtag: '"r1"',
    user: { id: 'u1' },
    pages: { today: { hash: 'h1' } },
  });
  expect(db.execAsync).toHaveBeenCalledTimes(1);
});

test('the SQLite cache drops one caller, or every caller of one app', async () => {
  const store = createSqliteCacheStore({ db: createFakeDb() });
  const entry = { root: {}, rootEtag: null, user: null };
  await store.writeRoot({ cacheKey: 'field:c1:r1', entry });
  await store.writePage({ cacheKey: 'field:c1:r1', pageId: 'today', page: { hash: 'h1' } });
  await store.writeRoot({ cacheKey: 'field:c2:r1', entry });
  await store.writeRoot({ cacheKey: 'fieldwork:c1:r1', entry });
  await store.removeEntry({ cacheKey: 'field:c2:r1' });
  expect(await store.read('field:c2:r1')).toBeNull();
  expect(await store.read('field:c1:r1')).not.toBeNull();
  await store.removeApp({ appId: 'field' });
  expect(await store.read('field:c1:r1')).toBeNull();
  expect(await store.read('fieldwork:c1:r1')).not.toBeNull();
});
