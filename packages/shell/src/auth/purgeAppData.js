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

import { appStorageKey } from '@lowdefy/helpers';

import getLastCacheKeyName from '../cache/getLastCacheKeyName.js';

/**
 * Removes everything the shell keeps for one app's signed-in person: the session token, every
 * cached root and page of the app (all its callers), the last cache key, and the person's keys in
 * the device store (SetLocalStorage's user keys, which the core puts under one prefix per app).
 * Device preferences stay. Nothing a person saw outlives their sign-out.
 *
 * @param {Object} params
 * @param {string} params.appId The app.
 * @param {Object} params.cacheStore The page cache.
 * @param {{ keys, remove }} params.kv The device store.
 * @param {string|null} params.slug The app's slug (lowdefyApp.slug), which names its storage keys.
 * @param {{ clear }} params.tokenStore The session token store.
 */
async function purgeAppData({ appId, cacheStore, kv, slug, tokenStore }) {
  await tokenStore.clear();
  await cacheStore.removeApp({ appId });
  kv.remove(getLastCacheKeyName(appId));
  // The shell renders every page with basePath '' (PageScreen).
  const userPrefix = appStorageKey({ basePath: '', name: 'lowdefy_user:', slug });
  kv.keys()
    .filter((key) => key.startsWith(userPrefix))
    .forEach((key) => kv.remove(key));
}

export default purgeAppData;
