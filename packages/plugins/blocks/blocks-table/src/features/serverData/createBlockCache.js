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

import getBlockRange from './getBlockRange.js';

function getBlockId({ listKey, index }) {
  return `${listKey}#${index}`;
}

// Rows of one server view, in blocks of `blockSize` per list (the root list and each expanded
// group's list). Blocks are evicted least recently used beyond `maxBlocks` loaded blocks, never
// one the caller still needs (`keep`) or one that is loading.
//
// `generation` counts invalidations. A load records the generation it started in and its
// response is only accepted if nothing invalidated the cache since (triggerEvent cannot be
// aborted, so stale responses are ignored instead). An invalidated block keeps its rows on screen
// until its reload lands.
function createBlockCache({ blockSize, maxBlocks }) {
  const lists = new Map();
  // Map iteration order is insertion order: touching a block re-inserts it, so the first entry
  // is always the least recently used.
  const blocks = new Map();
  let generation = 0;
  let loadedCount = 0;

  function getList(listKey) {
    let list = lists.get(listKey);
    if (!list) {
      list = { total: null, aggregates: null, error: null };
      lists.set(listKey, list);
    }
    return list;
  }

  function evict(keep) {
    for (const [id, block] of blocks) {
      if (loadedCount <= maxBlocks) return;
      if (block.status !== 'loaded' || keep?.has(id)) continue;
      blocks.delete(id);
      loadedCount -= 1;
    }
  }

  function setStatus(block, status) {
    if (block.status === 'loaded') loadedCount -= 1;
    if (status === 'loaded') loadedCount += 1;
    block.status = status;
  }

  const cache = {
    blockSize,
    getBlockId,
    get generation() {
      return generation;
    },
    get loadedCount() {
      return loadedCount;
    },
    getTotal(listKey) {
      return lists.get(listKey)?.total ?? null;
    },
    getAggregates(listKey) {
      return lists.get(listKey)?.aggregates ?? null;
    },
    getError(listKey) {
      return lists.get(listKey)?.error ?? null;
    },
    hasList(listKey) {
      return lists.has(listKey);
    },
    getBlock(listKey, index) {
      return blocks.get(getBlockId({ listKey, index }));
    },
    getRow(listKey, rowIndex) {
      const block = blocks.get(getBlockId({ listKey, index: Math.floor(rowIndex / blockSize) }));
      return block?.rows?.[rowIndex % blockSize];
    },
    touch(listKey, index) {
      const id = getBlockId({ listKey, index });
      const block = blocks.get(id);
      if (!block) return;
      blocks.delete(id);
      blocks.set(id, block);
    },
    // A block needs a load when it is missing or from an earlier generation. A block loading in
    // this generation, or one that failed in it, does not (a refresh retries failures).
    needsLoad(listKey, index) {
      const block = blocks.get(getBlockId({ listKey, index }));
      return !block || block.generation !== generation;
    },
    getMissingBlocks({ listKey, startRow, endRow }) {
      const { first, last } = getBlockRange({
        startRow,
        endRow,
        blockSize,
        total: cache.getTotal(listKey),
      });
      const missing = [];
      for (let index = first; index <= last; index++) {
        if (cache.needsLoad(listKey, index)) missing.push(index);
      }
      return missing;
    },
    startLoad(listKey, index) {
      getList(listKey);
      const id = getBlockId({ listKey, index });
      let block = blocks.get(id);
      if (!block) {
        block = { listKey, index, status: 'loading', rows: null, generation };
        blocks.set(id, block);
      } else {
        // An invalidated block keeps its rows (and status) on screen while it reloads.
        block.generation = generation;
        if (block.status !== 'loaded') setStatus(block, 'loading');
        block.reloading = true;
      }
      return { generation };
    },
    finishLoad({ listKey, index, generation: loadGeneration, rows, total, aggregates, keep }) {
      if (loadGeneration !== generation) return false;
      const block = blocks.get(getBlockId({ listKey, index }));
      if (!block || block.generation !== loadGeneration) return false;
      block.rows = rows;
      block.reloading = false;
      setStatus(block, 'loaded');
      const list = getList(listKey);
      list.total = total;
      list.aggregates = aggregates ?? null;
      list.error = null;
      cache.touch(listKey, index);
      evict(keep);
      return true;
    },
    failLoad({ listKey, index, generation: loadGeneration, error }) {
      if (loadGeneration !== generation) return false;
      const block = blocks.get(getBlockId({ listKey, index }));
      if (!block || block.generation !== loadGeneration) return false;
      block.reloading = false;
      if (block.status !== 'loaded') setStatus(block, 'error');
      getList(listKey).error = error;
      return true;
    },
    invalidate() {
      generation += 1;
    },
    // Visits the loaded rows of every list: `fn(rows, block)`.
    forEachLoaded(fn) {
      blocks.forEach((block) => {
        if (block.rows) fn(block.rows, block);
      });
    },
    // Replaces a loaded block's rows (a transaction); `total` changes with removed rows.
    setBlockRows({ listKey, index, rows }) {
      const block = blocks.get(getBlockId({ listKey, index }));
      if (block) block.rows = rows;
    },
    adjustTotal(listKey, delta) {
      const list = lists.get(listKey);
      if (list && typeof list.total === 'number') list.total = Math.max(0, list.total + delta);
    },
  };
  return cache;
}

export default createBlockCache;
