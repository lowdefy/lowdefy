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

import { getAuthorizationHeaders } from '@lowdefy/client-core';
import { type } from '@lowdefy/helpers';

import fetchPage from '../sync/fetchPage.js';
import fetchRoot from '../sync/fetchRoot.js';
import fetchUser from '../sync/fetchUser.js';
import getCacheKey from '../cache/getCacheKey.js';
import getLastCacheKeyName from '../cache/getLastCacheKeyName.js';
import reportShellError from '../host/reportShellError.js';
import runLimited from '../sync/runLimited.js';
import toRootConfig from '../sync/toRootConfig.js';

const PAGE_FETCH_LIMIT = 4;

// Pages kept for the new root: those still in its page index. A page whose hash changed stays, and
// is shown, until its new version arrives.
function keepIndexedPages({ pages, root }) {
  const indexed = new Set(root.pageIndex.map((entry) => entry.pageId));
  return Object.fromEntries(Object.entries(pages).filter(([pageId]) => indexed.has(pageId)));
}

// Hashed index entries whose page the shell does not hold at that hash. A dev root has no hashes:
// its pages are fetched when they are opened.
function getChangedEntries({ pages, root }) {
  return root.pageIndex.filter(
    (entry) => !type.isNone(entry.hash) && pages[entry.pageId]?.hash !== entry.hash
  );
}

/**
 * The state of one app in the shell, and how it follows the app's server: boot from the cache,
 * sync the mobile root and pages, and move onto a new build or a new caller.
 *
 * State, read with getState and followed with subscribe:
 * - `status`: 'loading' until a root is held (from the cache or the server), then 'ready';
 *   'error' when there is none and the server cannot be reached.
 * - `cacheKey`: app × caller × roles (getCacheKey) of the cache in use.
 * - `root`, `rootEtag`, `rootConfig`, `user`, `pages` ({ [pageId]: { hash, etag, buildId,
 *   pageConfig } }): what the screens render.
 * - `buildId`: the server build the root came from; page requests carry it.
 * - `lowdefy`: the app-level object the pages share, new each generation.
 * - `generation`: bumped when every screen must be rebuilt (a new caller or build).
 * - `homeRequests`: bumped when the shell must go back to the home page (a new caller).
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {{ id: string }} params.app The app, from shell.json.
 * @param {Object} params.cacheStore The page cache (createSqliteCacheStore).
 * @param {Function} params.fetch The Fetch API, sending the shell header (withShellHeader).
 * @param {{ get, set }} params.kv A synchronous key-value store on the device.
 * @param {{ get }} params.tokenStore The session token store.
 */
function createAppSession({ apiBase, app, cacheStore, fetch, kv, tokenStore }) {
  let state = {
    status: 'loading',
    error: null,
    cacheKey: null,
    root: null,
    rootEtag: null,
    rootConfig: null,
    user: null,
    pages: {},
    buildId: null,
    lowdefy: null,
    generation: 0,
    homeRequests: 0,
  };
  const listeners = new Set();
  let currentPath = '/';
  let currentInstanceId = null;
  let homeRequestsTaken = 0;
  let syncing = null;
  const pageLoads = new Map();

  function getState() {
    return state;
  }

  function setState(update) {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function fetchWithAuth(url, init) {
    const authorizationHeaders = getAuthorizationHeaders({
      host: { authTransport: 'bearer', tokenStore },
    });
    return fetch(url, { ...init, headers: { ...init.headers, ...authorizationHeaders } });
  }

  function newGeneration(buildId) {
    return { generation: state.generation + 1, lowdefy: { buildId } };
  }

  function setPage({ cacheKey, pageId, page }) {
    // A caller change while the page was in flight: it belongs to the previous cache.
    if (state.cacheKey !== cacheKey) {
      return;
    }
    setState({ pages: { ...state.pages, [pageId]: page } });
  }

  async function fetchChangedPages({ cacheKey, entries }) {
    // A page that failed keeps its held version, and is fetched again on the next sync or visit.
    const failures = await runLimited({
      items: entries,
      limit: PAGE_FETCH_LIMIT,
      fn: async (entry) => {
        const held = state.pages[entry.pageId];
        const result = await fetchPage({
          apiBase,
          etag: held?.etag,
          fetchWithAuth,
          path: entry.path,
        });
        if (result.notFound) {
          return;
        }
        const page = result.notModified
          ? { ...held, hash: entry.hash }
          : { ...result.page, hash: entry.hash };
        await cacheStore.writePage({ cacheKey, pageId: entry.pageId, page });
        setPage({ cacheKey, pageId: entry.pageId, page });
      },
    });
    failures.forEach(({ error }) => reportShellError({ error, session: { getState } }));
  }

  async function runSync() {
    const [rootResult, user] = await Promise.all([
      fetchRoot({ apiBase, etag: state.rootEtag, fetchWithAuth }),
      fetchUser({ apiBase, fetchWithAuth }),
    ]);
    const cacheKey = getCacheKey({ appId: app.id, stamp: rootResult.stamp });
    const callerChanged = state.cacheKey !== null && cacheKey !== state.cacheKey;
    // Another caller's pages: those cached when this caller last opened the app, if any. A 304 still
    // applies: the root is the same for both callers.
    const heldPages =
      cacheKey === state.cacheKey ? state.pages : (await cacheStore.read(cacheKey))?.pages ?? {};
    const root = rootResult.notModified ? state.root : rootResult.root;
    const pages = keepIndexedPages({ pages: heldPages, root });
    const removed = Object.keys(heldPages).filter((pageId) => pages[pageId] === undefined);
    await cacheStore.writeRoot({ cacheKey, entry: { root, rootEtag: rootResult.etag, user } });
    await cacheStore.removePages({ cacheKey, pageIds: removed });
    kv.set(getLastCacheKeyName(app.id), cacheKey);
    const buildId = root.lowdefyApp?.buildId ?? null;
    setState({
      status: 'ready',
      error: null,
      cacheKey,
      root,
      rootEtag: rootResult.etag,
      rootConfig: rootResult.notModified && !callerChanged ? state.rootConfig : toRootConfig(root),
      user,
      pages,
      buildId,
      ...(callerChanged || state.lowdefy === null ? newGeneration(buildId) : {}),
      ...(callerChanged ? { homeRequests: state.homeRequests + 1 } : {}),
    });
    await fetchChangedPages({ cacheKey, entries: getChangedEntries({ pages, root }) });
  }

  // One sync at a time: a build change met by several requests at once syncs once.
  function sync() {
    if (syncing === null) {
      syncing = runSync().finally(() => {
        syncing = null;
      });
    }
    return syncing;
  }

  // Renders the last pages this app showed at once, then syncs with the server in the background.
  // With nothing cached (first launch, a new caller) the shell waits for the sync.
  async function start() {
    const lastCacheKey = kv.get(getLastCacheKeyName(app.id));
    const entry = type.isNone(lastCacheKey) ? null : await cacheStore.read(lastCacheKey);
    if (entry !== null) {
      const buildId = entry.root.lowdefyApp?.buildId ?? null;
      setState({
        status: 'ready',
        cacheKey: lastCacheKey,
        root: entry.root,
        rootEtag: entry.rootEtag,
        rootConfig: toRootConfig(entry.root),
        user: entry.user,
        pages: entry.pages,
        buildId,
        ...newGeneration(buildId),
      });
    }
    try {
      await sync();
    } catch (error) {
      // With a cached root the app keeps working from the cache (no signal, a server down).
      reportShellError({ error, session: { getState } });
      if (state.status !== 'ready') {
        setState({ status: 'error', error });
      }
    }
  }

  // A page that is opened: fetched when the shell does not hold it, or holds a version that may be
  // old (a dynamic page, built per request, or a dev page, built on demand).
  function loadPage({ entry, path }) {
    const held = state.pages[entry.pageId];
    const perVisit = type.isNone(entry.hash) || held?.pageConfig?.dynamic === true;
    if (held !== undefined && !perVisit) {
      return Promise.resolve();
    }
    const fetchPath = perVisit ? path : entry.path;
    const loadKey = `${state.cacheKey}|${entry.pageId}|${fetchPath}`;
    if (!pageLoads.has(loadKey)) {
      const { cacheKey } = state;
      const load = fetchPage({ apiBase, etag: held?.etag, fetchWithAuth, path: fetchPath })
        .then(async (result) => {
          if (result.notFound || result.notModified) {
            return;
          }
          const page = { ...result.page, hash: entry.hash ?? null };
          await cacheStore.writePage({ cacheKey, pageId: entry.pageId, page });
          setPage({ cacheKey, pageId: entry.pageId, page });
        })
        .finally(() => pageLoads.delete(loadKey));
      pageLoads.set(loadKey, load);
    }
    return pageLoads.get(loadKey);
  }

  // A path no mobile page has: { surface: 'web' } when the server has a web page there.
  async function fetchOtherPage(path) {
    return fetchPage({ apiBase, fetchWithAuth, path });
  }

  // The core's onBuildChanged: a page request was refused for another build and could not be
  // retried (its page changed with the build). Like the web's reload: sync, then rebuild every
  // screen on the current route.
  async function handleBuildChanged() {
    await sync();
    setState(newGeneration(state.buildId));
  }

  // The core's onCallerChanged: the server answered as another caller (sign-in, sign-out, an
  // organisation or role change). Drops the screens, syncs under the new caller's key and goes home.
  async function handleCallerChanged() {
    setState({
      status: 'loading',
      ...newGeneration(state.buildId),
      homeRequests: state.homeRequests + 1,
    });
    try {
      await sync();
    } catch (error) {
      reportShellError({ error, session: { getState } });
      setState({ status: 'error', error });
    }
  }

  // The entry the page a request is for, read from a /api/request/<pageId>/<requestId> URL.
  function getRequestPageEntry(url) {
    const match = /\/api\/request\/([^/]+)\//.exec(url);
    if (match === null || state.root === null) {
      return null;
    }
    const pageId = decodeURIComponent(match[1]);
    return state.root.pageIndex.find((entry) => entry.pageId === pageId) ?? null;
  }

  // True once for each home request: the frame that is mounted when it comes goes home.
  function takeHomeRequest() {
    if (state.homeRequests <= homeRequestsTaken) {
      return false;
    }
    homeRequestsTaken = state.homeRequests;
    return true;
  }

  return {
    apiBase,
    app,
    fetchOtherPage,
    getCurrentInstanceId: () => currentInstanceId,
    getCurrentPath: () => currentPath,
    getRequestPageEntry,
    getState,
    handleBuildChanged,
    handleCallerChanged,
    loadPage,
    // The focused screen: its route (path and query) and its route instance, which keys its page
    // context.
    setCurrentPath: (path, instanceId = null) => {
      currentPath = path;
      currentInstanceId = instanceId;
    },
    start,
    subscribe,
    sync,
    takeHomeRequest,
  };
}

export default createAppSession;
