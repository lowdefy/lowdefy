/**
 * @jest-environment jsdom
 */
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

import createRecorder from './createRecorder.js';

let registry;
let fetch;
let recorder;

function createRegistry() {
  const listeners = [];
  return {
    listeners,
    subscribe: jest.fn((listener, options) => {
      listeners.push({ listener, options });
      return () => listeners.splice(listeners.indexOf(listener), 1);
    }),
    describeElement: jest.fn((element) => ({
      page_id: 'tickets',
      block_id: element.closest('[id^="bl-"]')?.id.slice(3) ?? null,
      block_type: null,
      row: null,
      column: null,
      text: element.textContent.trim() || null,
      nth: null,
      option: false,
      block_ids: element.closest('[id^="bl-"]') ? [element.closest('[id^="bl-"]').id.slice(3)] : [],
    })),
  };
}

function start(recording = { enabled: true }, lowdefy = { user: { roles: ['admin'] } }) {
  return createRecorder({
    basePath: '/base',
    lowdefy,
    recording,
    window,
    getTrace: () => registry,
  });
}

function sentBodies() {
  return fetch.mock.calls.map(([, init]) => JSON.parse(init.body));
}

beforeEach(() => {
  registry = createRegistry();
  fetch = jest.fn(() => Promise.resolve({ status: 204 }));
  window.fetch = fetch;
  window.sessionStorage.clear();
  document.body.innerHTML = '<div id="bl-save"><button id="save">Save</button></div>';
  recorder = null;
});

afterEach(() => {
  recorder?.stop();
  jest.restoreAllMocks();
});

test('createRecorder with recording off subscribes to nothing and adds no listener', () => {
  const addListener = jest.spyOn(document, 'addEventListener');
  expect(start({ enabled: false })).toBe(null);
  expect(start(null)).toBe(null);
  expect(registry.subscribe).not.toHaveBeenCalled();
  expect(addListener).not.toHaveBeenCalled();
  expect(window.__lowdefyRecorder).toBeUndefined();
});

test('createRecorder subscribes once with state and posts records as keepalive fetches', async () => {
  recorder = start();
  expect(registry.subscribe).toHaveBeenCalledTimes(1);
  expect(registry.listeners[0].options).toEqual({ state: true });
  recorder.pageview('tickets');
  document.getElementById('save').click();
  await window.__lowdefyRecorder.flush();
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe('/base/api/dev-recording');
  expect(init).toMatchObject({ method: 'POST', keepalive: true });
  const [body] = sentBodies();
  expect(body.session).toMatch(/^\d{8}T\d{6}Z-[a-z0-9]{6}$/);
  expect(body.records.map((record) => record.kind)).toEqual(['pageview', 'click']);
  expect(body.records[1]).toMatchObject({ roles: ['admin'], target: { block_id: 'save' } });
});

test('createRecorder flushes on pagehide', async () => {
  recorder = start();
  document.getElementById('save').click();
  window.dispatchEvent(new Event('pagehide'));
  await Promise.resolve();
  expect(sentBodies()[0].records[0].kind).toBe('click');
});

test("createRecorder flushes on the shared stream's reload event and detaches cleanly", async () => {
  recorder = start();
  const source = new EventTarget();
  const detach = recorder.attachStream(source);
  document.getElementById('save').click();
  source.dispatchEvent(new Event('reload'));
  await Promise.resolve();
  expect(fetch).toHaveBeenCalledTimes(1);
  detach();
  document.getElementById('save').click();
  source.dispatchEvent(new Event('reload'));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(recorder.attachStream(null)).toEqual(expect.any(Function));
});

test('an interaction whose hold closes after a config reload keeps the build it was captured under', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: '2026-10-03T14:02:00.000Z' };
  recorder = start({ enabled: true }, lowdefy);
  const source = new EventTarget();
  recorder.attachStream(source);
  recorder.pageview('tickets');
  document.getElementById('save').click();
  lowdefy._devBuildId = '2026-10-03T14:05:00.000Z';
  source.dispatchEvent(new Event('reload'));
  await Promise.resolve();
  const [body] = sentBodies();
  expect(body.records.map((record) => [record.kind, record.build])).toEqual([
    ['pageview', '2026-10-03T14:02:00.000Z'],
    ['click', '2026-10-03T14:02:00.000Z'],
  ]);
});

test('an engine record keeps the build its trace payload arrived under', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: '2026-10-03T14:02:00.000Z' };
  recorder = start({ enabled: true }, lowdefy);
  registry.listeners[0].listener({
    scope: 'page',
    pageId: 'tickets',
    blockId: 'tickets',
    blockType: 'Box',
    eventName: 'onMount',
    success: true,
    failure: null,
    debounceMs: 0,
    actions: [],
    record: { startTimestamp: new Date(), responses: {} },
    context: { state: {}, requests: {} },
    stateBefore: {},
  });
  lowdefy._devBuildId = '2026-10-03T14:05:00.000Z';
  await window.__lowdefyRecorder.flush();
  const [record] = sentBodies()[0].records;
  expect(record).toMatchObject({ kind: 'engine', build: '2026-10-03T14:02:00.000Z' });
});

test('a record made before any page config named its build carries build null', async () => {
  recorder = start();
  document.getElementById('save').click();
  await window.__lowdefyRecorder.flush();
  expect(sentBodies()[0].records[0].build).toBe(null);
});

test('flush resolves only after the POST settles', async () => {
  let respond;
  fetch.mockImplementation(
    () =>
      new Promise((resolve) => {
        respond = resolve;
      })
  );
  recorder = start();
  document.getElementById('save').click();
  let done = false;
  const flushed = window.__lowdefyRecorder.flush().then(() => {
    done = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toBe(false);
  respond({ status: 204 });
  await flushed;
  expect(done).toBe(true);
});

test('a throwing trace payload or describeElement leaves the app running', () => {
  recorder = start();
  expect(() => registry.listeners[0].listener(null)).not.toThrow();
  registry.describeElement.mockImplementation(() => {
    throw new Error('broken');
  });
  expect(() => document.getElementById('save').click()).not.toThrow();
});

test('a throwing sessionStorage leaves the recorder recording under an unremembered session', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('SecurityError');
  });
  recorder = start();
  document.getElementById('save').click();
  await window.__lowdefyRecorder.flush();
  expect(sentBodies()[0].session).toMatch(/^\d{8}T\d{6}Z-[a-z0-9]{6}$/);
});

test('a failed send is dropped silently', async () => {
  fetch.mockImplementation(() => Promise.reject(new Error('offline')));
  recorder = start();
  document.getElementById('save').click();
  await expect(window.__lowdefyRecorder.flush()).resolves.toBeUndefined();
});

test('stop unsubscribes, removes listeners and the flush hook', () => {
  recorder = start();
  recorder.stop();
  expect(registry.listeners).toHaveLength(0);
  expect(window.__lowdefyRecorder).toBeUndefined();
  document.getElementById('save').click();
  recorder = null;
  expect(fetch).not.toHaveBeenCalled();
});
