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

import applyTransactionToRows from '../transactions/applyTransactionToRows.js';
import buildServerItems from './buildServerItems.js';
import createBlockCache from './createBlockCache.js';
import getBlockRange from './getBlockRange.js';
import getListKey from './getListKey.js';
import getNeededBlocks from './getNeededBlocks.js';
import readFetchResult from './readFetchResult.js';

const ROOT = getListKey([]);
// Range changes faster than this (rows per millisecond, about 2000px/s at 40px rows) are a fast
// scroll or a scrollbar jump: loads wait until the range settles.
const FAST_ROWS_PER_MS = 0.05;
const SETTLE_MS = 120;

// Server mode's data source (D9). It owns the block cache of the current view, fetches blocks
// through the table's internal `__tableFetch` event, and keeps the previous view's cache on
// screen (dimmed) until the new view's first block lands. React subscribes to `version`.
function createServerStore({ api, server }) {
  const { blockSize, maxBlocks } = server;
  const listeners = new Set();
  const store = {
    cache: createBlockCache({ blockSize, maxBlocks }),
    previous: null,
    view: null,
    viewKey: null,
    groupKey: null,
    selected: undefined,
    expandedGroups: new Set(),
    segments: [],
    visible: new Set(),
    lastRange: null,
    timer: null,
    version: 0,
    requestCount: 0,
    loadedRows: { version: -1, rows: [] },
    itemCache: new WeakMap(),
  };

  function notify() {
    store.version += 1;
    listeners.forEach((listener) => listener());
  }

  // The cache on screen: the current view's, or the previous view's until the first block of
  // the current one lands.
  function getDisplayCache() {
    if (store.previous && store.cache.getTotal(ROOT) === null && !store.cache.getError(ROOT)) {
      return store.previous;
    }
    return store.cache;
  }

  function fetchBlock({ listKey, groupPath, index }) {
    const { cache } = store;
    if (!cache.needsLoad(listKey, index)) return;
    const { generation } = cache.startLoad(listKey, index);
    const isGroupLevel = groupPath.length < (store.view.group ?? []).length;
    store.requestCount += 1;
    const event = {
      startRow: index * blockSize,
      endRow: (index + 1) * blockSize,
      view: store.view,
      groupPath,
      selected: store.selected,
    };
    Promise.resolve(api.methods.triggerEvent({ name: '__tableFetch', event })).then((result) => {
      // A later view has its own cache: this response belongs to a superseded view.
      if (cache !== store.cache) return;
      if (result?.success !== true) {
        if (cache.failLoad({ listKey, index, generation, error: result?.error ?? true })) notify();
        return;
      }
      let read;
      try {
        read = readFetchResult({ result, isGroupLevel });
      } catch (error) {
        cache.failLoad({ listKey, index, generation, error });
        notify();
        throw error;
      }
      const accepted = cache.finishLoad({
        listKey,
        index,
        generation,
        rows: read.entries,
        total: read.total,
        aggregates: read.aggregates,
        keep: store.visible,
      });
      if (!accepted) return;
      if (listKey === ROOT) store.previous = null;
      notify();
    });
  }

  function loadVisible() {
    store.timer = null;
    const range = store.lastRange;
    if (!range || !store.view) return;
    let needed;
    if (getDisplayCache() !== store.cache) {
      // The items on screen belong to the previous view; only the new root list maps to them.
      const { first, last } = getBlockRange({
        startRow: range.rowStart,
        endRow: range.rowEnd,
        blockSize,
      });
      needed = [];
      for (let index = first; index <= last; index++) {
        needed.push({ listKey: ROOT, groupPath: [], index });
      }
    } else {
      needed = getNeededBlocks({
        segments: store.segments,
        rowStart: range.rowStart,
        rowEnd: range.rowEnd,
        blockSize,
      });
    }
    store.visible = new Set(needed.map((block) => store.cache.getBlockId(block)));
    needed.forEach((block) => {
      store.cache.touch(block.listKey, block.index);
      fetchBlock(block);
    });
  }

  Object.assign(store, {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isLoading() {
      const display = getDisplayCache();
      return display.getTotal(ROOT) === null && !display.getError(ROOT);
    },
    isPending() {
      return getDisplayCache() !== store.cache;
    },
    getAggregates() {
      return getDisplayCache().getAggregates(ROOT);
    },
    getTotal() {
      return getDisplayCache().getTotal(ROOT);
    },
    // The view the request receives: `{ sort, filter, search, group, aggregates }`. A new view
    // gets a new cache and starts from the top; the old rows stay until its first block lands.
    setView({ view, viewKey }) {
      if (viewKey === store.viewKey) return;
      const initial = store.viewKey === null;
      const groupKey = JSON.stringify(view.group ?? []);
      if (groupKey !== store.groupKey) store.expandedGroups = new Set();
      store.groupKey = groupKey;
      store.view = view;
      store.viewKey = viewKey;
      if (!initial) {
        if (getDisplayCache() === store.cache) store.previous = store.cache;
        store.cache = createBlockCache({ blockSize, maxBlocks });
        const scroller = api.scrollerRef.current;
        if (scroller) scroller.scrollTop = 0;
        store.lastRange = null;
      }
      fetchBlock({ listKey: ROOT, groupPath: [], index: 0 });
      notify();
    },
    onRange({ rowStart, rowEnd }) {
      const now = performance.now();
      const last = store.lastRange;
      if (last && last.rowStart === rowStart && last.rowEnd === rowEnd) {
        // The same range with new items under it (a block landed, a group opened). A fast scroll
        // still waiting to settle keeps waiting: loading here would load every position a
        // landing block happens to find the scroll at.
        if (!store.timer) loadVisible();
        return;
      }
      const velocity = last ? Math.abs(rowStart - last.rowStart) / Math.max(1, now - last.time) : 0;
      store.lastRange = { rowStart, rowEnd, time: now };
      if (store.timer) clearTimeout(store.timer);
      if (velocity <= FAST_ROWS_PER_MS) {
        loadVisible();
        return;
      }
      store.timer = setTimeout(loadVisible, SETTLE_MS);
    },
    buildItems({ rowsById, getId }) {
      const built = buildServerItems({
        blockCache: getDisplayCache(),
        groupKeys: (store.view?.group ?? []).map((entry) => entry.key),
        expandedGroups: store.expandedGroups,
        rowsById,
        getId,
        itemCache: store.itemCache,
      });
      store.segments = built.segments;
      return built;
    },
    // Leaf rows of the cache on screen, for TanStack (selection, row lookup, events).
    getLoadedRows() {
      if (store.loadedRows.version === store.version) return store.loadedRows.rows;
      const levels = (store.view?.group ?? []).length;
      const rows = [];
      getDisplayCache().forEachLoaded((blockRows, block) => {
        if (JSON.parse(block.listKey).length < levels) return;
        blockRows.forEach((row) => rows.push(row));
      });
      store.loadedRows = { version: store.version, rows };
      return rows;
    },
    toggleGroup({ key, expanded }) {
      const next = expanded ?? !store.expandedGroups.has(key);
      if (next === store.expandedGroups.has(key)) return;
      if (next) {
        store.expandedGroups.add(key);
        fetchBlock({ listKey: key, groupPath: JSON.parse(key), index: 0 });
      } else {
        store.expandedGroups.delete(key);
      }
      notify();
    },
    collapseAllGroups() {
      if (store.expandedGroups.size === 0) return false;
      store.expandedGroups = new Set();
      notify();
      return true;
    },
    // Purges the cache: every block reloads when it is next visible, the visible ones now. Rows
    // stay on screen until their reload lands.
    refresh() {
      store.cache.invalidate();
      if (store.timer) clearTimeout(store.timer);
      fetchBlock({ listKey: ROOT, groupPath: [], index: 0 });
      loadVisible();
      notify();
    },
    // Updates merge into loaded rows in place. Removed rows leave their block at once; adds and
    // removes shift the server's row positions, so the cache is invalidated and the visible
    // blocks reload.
    applyTransaction(transaction) {
      const changed = { added: transaction.add.length, updated: 0, removed: 0 };
      const levels = (store.view?.group ?? []).length;
      store.cache.forEachLoaded((rows, block) => {
        if (JSON.parse(block.listKey).length < levels) return;
        const result = applyTransactionToRows({
          rows,
          transaction: { ...transaction, add: [] },
          getKey: api.config.getKey,
        });
        if (result.changed.updated === 0 && result.changed.removed === 0) return;
        changed.updated += result.changed.updated;
        changed.removed += result.changed.removed;
        store.cache.setBlockRows({ listKey: block.listKey, index: block.index, rows: result.rows });
        store.cache.adjustTotal(block.listKey, -result.changed.removed);
      });
      if (transaction.add.length > 0 || changed.removed > 0) {
        store.refresh();
      } else {
        notify();
      }
      return changed;
    },
    dispose() {
      if (store.timer) clearTimeout(store.timer);
      listeners.clear();
    },
  });
  return store;
}

export default createServerStore;
