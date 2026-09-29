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

import createServerStore from './createServerStore.js';

const VIEW = { sort: [], filter: null, search: null, group: [], aggregates: {} };

function createDeferredApi() {
  const calls = [];
  const api = {
    config: { getKey: (row) => row.id },
    scrollerRef: { current: { scrollTop: 500 } },
    methods: {
      triggerEvent: jest.fn(({ event }) => {
        let resolve;
        const promise = new Promise((done) => {
          resolve = done;
        });
        calls.push({ event, resolve });
        return promise;
      }),
    },
  };
  return { api, calls };
}

function respond(call, { rows, total, groups, aggregates }) {
  call.resolve({
    success: true,
    responses: { __tableFetch: { response: [{ rows, total, groups, aggregates }] } },
  });
  return new Promise((done) => setTimeout(done, 0));
}

function rows(start, count) {
  return Array.from({ length: count }, (_, i) => ({ id: start + i }));
}

function build(store) {
  const loaded = store.getLoadedRows();
  const rowsById = Object.fromEntries(
    loaded.map((row) => [String(row.id), { id: String(row.id) }])
  );
  return store.buildItems({ rowsById, getId: (row) => String(row.id) }).items;
}

test('createServerStore fetches the first block with the view when the view is set', () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.selected = ['x'];
  store.setView({ view: VIEW, viewKey: 'a' });
  expect(api.methods.triggerEvent).toHaveBeenCalledTimes(1);
  expect(api.methods.triggerEvent.mock.calls[0][0].name).toBe('__tableFetch');
  expect(calls[0].event).toEqual({
    startRow: 0,
    endRow: 50,
    view: VIEW,
    groupPath: [],
    selected: ['x'],
  });
  expect(store.isLoading()).toBe(true);
});

test('createServerStore shows the total as rows with holes once the first block lands', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: rows(0, 50), total: 1000 });
  expect(store.isLoading()).toBe(false);
  const items = build(store);
  expect(items).toHaveLength(1000);
  expect(items[49].id).toBe('49');
  expect(items[50]).toBeUndefined();
});

test('createServerStore ignores the response of a superseded view and keeps its rows until the new one lands', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: rows(0, 50), total: 1000 });
  const sorted = { ...VIEW, sort: [{ key: 'name' }] };
  store.setView({ view: sorted, viewKey: 'b' });
  expect(api.scrollerRef.current.scrollTop).toBe(0);
  expect(calls[1].event).toMatchObject({ startRow: 0, view: sorted });
  expect(store.isPending()).toBe(true);
  expect(build(store)[0].id).toBe('0');
  const other = { ...VIEW, sort: [{ key: 'age' }] };
  store.setView({ view: other, viewKey: 'c' });
  await respond(calls[1], { rows: rows(500, 50), total: 10 });
  expect(store.isPending()).toBe(true);
  expect(build(store)[0].id).toBe('0');
  await respond(calls[2], { rows: rows(900, 50), total: 50 });
  expect(store.isPending()).toBe(false);
  const items = build(store);
  expect(items).toHaveLength(50);
  expect(items[0].id).toBe('900');
});

test('createServerStore ignores a response that was in flight when the table refreshed', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: rows(0, 50), total: 100 });
  build(store);
  store.onRange({ rowStart: 40, rowEnd: 60 });
  expect(calls[1].event.startRow).toBe(50);
  store.refresh();
  // The refresh reloads both visible blocks; the stale load of block 1 is ignored.
  const refreshed = calls.slice(2).map((call) => call.event.startRow);
  expect(refreshed).toEqual([0, 50]);
  await respond(calls[1], { rows: rows(1000, 50), total: 100 });
  expect(build(store)[50]).toBeUndefined();
  await respond(calls[3], { rows: rows(2000, 50), total: 100 });
  expect(build(store)[50].id).toBe('2000');
});

test('createServerStore waits for a fast scroll to settle before loading', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  let now = 0;
  const spy = jest.spyOn(performance, 'now').mockImplementation(() => now);
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  calls[0].resolve({
    success: true,
    responses: { __tableFetch: { response: [{ rows: rows(0, 50), total: 100000 }] } },
  });
  await Promise.resolve();
  await Promise.resolve();
  build(store);
  store.onRange({ rowStart: 0, rowEnd: 30 });
  for (let step = 1; step <= 20; step++) {
    now += 16;
    store.onRange({ rowStart: step * 1000, rowEnd: step * 1000 + 30 });
  }
  expect(calls).toHaveLength(1);
  jest.advanceTimersByTime(200);
  expect(calls).toHaveLength(2);
  expect(calls[1].event.startRow).toBe(20000);
  spy.mockRestore();
});

afterEach(() => {
  jest.useRealTimers();
});

test('createServerStore loads a group level lazily when the group opens', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  const grouped = { ...VIEW, group: [{ key: 'stage' }] };
  store.setView({ view: grouped, viewKey: 'g' });
  await respond(calls[0], {
    rows: [],
    groups: [
      { key: 'lead', count: 2 },
      { key: 'won', count: 1 },
    ],
    total: 2,
  });
  let items = build(store);
  expect(items.map((item) => item.kind)).toEqual(['group', 'group']);
  expect(calls).toHaveLength(1);
  store.toggleGroup({ key: '["lead"]' });
  expect(calls[1].event).toMatchObject({ groupPath: ['lead'], startRow: 0 });
  items = build(store);
  // The group's count of skeleton rows and a spinner in its chevron until its block lands.
  expect(items).toHaveLength(4);
  expect(items[0].loading).toBe(true);
  expect(items[1]).toBeUndefined();
  expect(items[2]).toBeUndefined();
  await respond(calls[1], { rows: [{ id: 'a' }, { id: 'b' }], total: 2 });
  items = build(store);
  expect(items.map((item) => item.key ?? item.id)).toEqual(['["lead"]', 'a', 'b', '["won"]']);
});

test('createServerStore merges transaction updates into loaded rows without a refetch', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], {
    rows: [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ],
    total: 2,
  });
  const changed = store.applyTransaction({
    add: [],
    update: [{ id: 2, name: 'B' }],
    remove: [],
  });
  expect(changed).toEqual({ added: 0, updated: 1, removed: 0 });
  expect(store.getLoadedRows()).toEqual([
    { id: 1, name: 'a' },
    { id: 2, name: 'B' },
  ]);
  expect(calls).toHaveLength(1);
  store.applyTransaction({ add: [], update: [], remove: [1] });
  expect(store.getLoadedRows()).toEqual([{ id: 2, name: 'B' }]);
  expect(calls).toHaveLength(2);
});

test('createServerStore does not load mid-scroll when a block lands during a fast scroll', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  let now = 0;
  const spy = jest.spyOn(performance, 'now').mockImplementation(() => now);
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  store.onRange({ rowStart: 0, rowEnd: 30 });
  now += 16;
  store.onRange({ rowStart: 5000, rowEnd: 5030 });
  calls[0].resolve({
    success: true,
    responses: { __tableFetch: { response: [{ rows: rows(0, 50), total: 100000 }] } },
  });
  await Promise.resolve();
  await Promise.resolve();
  build(store);
  // The landed block re-renders the grid with the same range.
  store.onRange({ rowStart: 5000, rowEnd: 5030 });
  expect(calls).toHaveLength(1);
  jest.advanceTimersByTime(200);
  expect(calls).toHaveLength(2);
  expect(calls[1].event.startRow).toBe(5000);
  spy.mockRestore();
});

test('createServerStore gives each loaded row its index in its list on the server', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 50, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: rows(0, 50), total: 200 });
  build(store);
  store.onRange({ rowStart: 100, rowEnd: 120 });
  await respond(calls[1], { rows: rows(100, 50), total: 200 });
  expect(store.getRowIndex(10)).toBe(10);
  expect(store.getRowIndex(110)).toBe(110);
  expect(store.getRowIndex(60)).toBeNull();
});

test('createServerStore retries only the failed block and keeps the loaded rows', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 2, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: [{ id: 1 }, { id: 2 }], total: 4 });
  build(store);
  store.onRange({ rowStart: 0, rowEnd: 4 });
  expect(calls[1].event).toMatchObject({ startRow: 2, endRow: 4 });
  calls[1].resolve({ success: false, error: { message: 'Down' } });
  await new Promise((done) => setTimeout(done, 0));
  let items = build(store);
  expect(items[2]).toMatchObject({ kind: 'error', index: 1 });
  store.retry({ listKey: '[]', groupPath: [], index: 1 });
  expect(calls).toHaveLength(3);
  expect(calls[2].event).toMatchObject({ startRow: 2, endRow: 4 });
  items = build(store);
  expect(items.map((item) => item?.id)).toEqual(['1', '2', undefined, undefined]);
  await respond(calls[2], { rows: [{ id: 3 }, { id: 4 }], total: 4 });
  expect(build(store).map((item) => item?.id)).toEqual(['1', '2', '3', '4']);
});

test('createServerStore is refreshing while loaded blocks reload', async () => {
  const { api, calls } = createDeferredApi();
  const store = createServerStore({ api, server: { blockSize: 2, maxBlocks: 10 } });
  store.setView({ view: VIEW, viewKey: 'a' });
  await respond(calls[0], { rows: [{ id: 1 }, { id: 2 }], total: 2 });
  expect(store.isRefreshing()).toBe(false);
  store.refresh();
  expect(store.isRefreshing()).toBe(true);
  expect(store.isPending()).toBe(false);
  await respond(calls.at(-1), { rows: [{ id: 1 }, { id: 2 }], total: 2 });
  expect(store.isRefreshing()).toBe(false);
});
