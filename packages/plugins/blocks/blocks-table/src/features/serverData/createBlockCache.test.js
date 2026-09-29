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

import createBlockCache from './createBlockCache.js';

function rows(start, count) {
  return Array.from({ length: count }, (_, i) => ({ id: start + i }));
}

function load(cache, { listKey = '[]', index, total = 1000, keep }) {
  const { generation } = cache.startLoad(listKey, index);
  return cache.finishLoad({
    listKey,
    index,
    generation,
    rows: rows(index * cache.blockSize, cache.blockSize),
    total,
    keep,
  });
}

test('createBlockCache maps a row index to its block and offset', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  load(cache, { index: 2 });
  expect(cache.getRow('[]', 25)).toEqual({ id: 25 });
  expect(cache.getRow('[]', 5)).toBeUndefined();
  expect(cache.getTotal('[]')).toBe(1000);
});

test('createBlockCache keeps the lists of different group paths apart', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  load(cache, { listKey: '["a"]', index: 0, total: 3 });
  load(cache, { listKey: '["b"]', index: 0, total: 7 });
  expect(cache.getTotal('["a"]')).toBe(3);
  expect(cache.getTotal('["b"]')).toBe(7);
  expect(cache.getTotal('[]')).toBeNull();
  expect(cache.needsLoad('["a"]', 0)).toBe(false);
  expect(cache.needsLoad('["c"]', 0)).toBe(true);
});

test('createBlockCache evicts the least recently used loaded block beyond maxBlocks', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 3 });
  load(cache, { index: 0 });
  load(cache, { index: 1 });
  load(cache, { index: 2 });
  cache.touch('[]', 0);
  load(cache, { index: 3 });
  expect(cache.loadedCount).toBe(3);
  expect(cache.getBlock('[]', 1)).toBeUndefined();
  expect(cache.getBlock('[]', 0).status).toBe('loaded');
  expect(cache.getBlock('[]', 2).status).toBe('loaded');
  expect(cache.getBlock('[]', 3).status).toBe('loaded');
});

test('createBlockCache never evicts a block the caller keeps or one that is loading', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 2 });
  load(cache, { index: 0 });
  load(cache, { index: 1 });
  cache.startLoad('[]', 5);
  load(cache, { index: 2, keep: new Set(['[]#0']) });
  expect(cache.getBlock('[]', 0).status).toBe('loaded');
  expect(cache.getBlock('[]', 1)).toBeUndefined();
  expect(cache.getBlock('[]', 5).status).toBe('loading');
});

test('createBlockCache ignores a response that started before an invalidation', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  const { generation } = cache.startLoad('[]', 0);
  cache.invalidate();
  const accepted = cache.finishLoad({
    listKey: '[]',
    index: 0,
    generation,
    rows: rows(0, 10),
    total: 50,
  });
  expect(accepted).toBe(false);
  expect(cache.getRow('[]', 0)).toBeUndefined();
  expect(cache.needsLoad('[]', 0)).toBe(true);
});

test('createBlockCache keeps an invalidated block on screen until its reload lands', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  load(cache, { index: 0, total: 50 });
  cache.invalidate();
  expect(cache.needsLoad('[]', 0)).toBe(true);
  expect(cache.getRow('[]', 3)).toEqual({ id: 3 });
  const { generation } = cache.startLoad('[]', 0);
  expect(cache.needsLoad('[]', 0)).toBe(false);
  expect(cache.getRow('[]', 3)).toEqual({ id: 3 });
  cache.finishLoad({
    listKey: '[]',
    index: 0,
    generation,
    rows: [{ id: 'new' }],
    total: 1,
  });
  expect(cache.getRow('[]', 0)).toEqual({ id: 'new' });
  expect(cache.getTotal('[]')).toBe(1);
});

test('createBlockCache ignores the older of two loads of one block', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  const first = cache.startLoad('[]', 0);
  cache.invalidate();
  const second = cache.startLoad('[]', 0);
  expect(
    cache.finishLoad({ listKey: '[]', index: 0, generation: second.generation, rows: [], total: 0 })
  ).toBe(true);
  expect(
    cache.finishLoad({ listKey: '[]', index: 0, generation: first.generation, rows: [], total: 9 })
  ).toBe(false);
  expect(cache.getTotal('[]')).toBe(0);
});

test('createBlockCache does not retry a failed block until it is invalidated', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  const { generation } = cache.startLoad('[]', 0);
  cache.failLoad({ listKey: '[]', index: 0, generation, error: new Error('down') });
  expect(cache.getBlock('[]', 0).status).toBe('error');
  expect(cache.getError('[]').message).toBe('down');
  expect(cache.needsLoad('[]', 0)).toBe(false);
  cache.invalidate();
  expect(cache.needsLoad('[]', 0)).toBe(true);
});

test('createBlockCache lists the missing blocks of a row range, clipped to the total', () => {
  const cache = createBlockCache({ blockSize: 10, maxBlocks: 5 });
  load(cache, { index: 1, total: 35 });
  expect(cache.getMissingBlocks({ listKey: '[]', startRow: 5, endRow: 100 })).toEqual([0, 2, 3]);
});
