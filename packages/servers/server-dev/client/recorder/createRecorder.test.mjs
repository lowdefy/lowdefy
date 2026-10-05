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

// The page instance on screen, as Routing hands it to the Recorder.
function page(pageId, pathParams = {}) {
  return { pageId, pathParams, instanceKey: `page:${pageId}:${JSON.stringify(pathParams)}` };
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
  recorder.pageview({ path: 'tickets' });
  recorder.pageShown(page('tickets'));
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
  recorder.pageview({ path: 'tickets' });
  recorder.pageShown(page('tickets'));
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
  const lowdefy = { user: { roles: ['admin'] } };
  recorder = start({ enabled: true }, lowdefy);
  recorder.stop();
  expect(registry.listeners).toHaveLength(0);
  expect(window.__lowdefyRecorder).toBeUndefined();
  document.getElementById('save').click();
  recorder = null;
  expect(fetch).not.toHaveBeenCalled();
});

const BUILD_A = '2026-10-03T14:02:00.000Z';
const BUILD_B = '2026-10-03T14:05:00.000Z';

test('a pageview waits for its page to be shown and carries the build that page rendered under', async () => {
  const lowdefy = { user: { roles: ['admin'] } };
  recorder = start({ enabled: true }, lowdefy);
  recorder.pageview({ path: 'tickets' });
  await window.__lowdefyRecorder.flush();
  expect(fetch).not.toHaveBeenCalled();
  lowdefy._devBuildId = BUILD_A;
  recorder.pageShown(page('tickets'));
  await window.__lowdefyRecorder.flush();
  const [record] = sentBodies()[0].records;
  expect(record).toMatchObject({ kind: 'pageview', page_id: 'tickets', build: BUILD_A });
});

test('a navigation carries the build of the new page config, not the one the previous page ran on', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: BUILD_A };
  recorder = start({ enabled: true }, lowdefy);
  recorder.pageview({ path: 'tickets' });
  recorder.pageShown(page('tickets'));
  recorder.pageview({ path: 'orders' });
  lowdefy._devBuildId = BUILD_B;
  recorder.pageShown(page('orders'));
  await window.__lowdefyRecorder.flush();
  expect(sentBodies()[0].records.map((record) => record.build)).toEqual([BUILD_A, BUILD_B]);
});

test('a path left before its page was shown is not recorded', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: BUILD_A };
  recorder = start({ enabled: true }, lowdefy);
  recorder.pageview({ path: 'tickets' });
  recorder.pageShown(page('tickets'));
  recorder.pageview({ path: 'orders' });
  recorder.pageview({ path: 'settings' });
  window.dispatchEvent(new Event('pagehide'));
  await Promise.resolve();
  expect(sentBodies()[0].records.map((record) => record.page_id)).toEqual(['tickets']);
});

test('coming back to the page still on screen is its visit at once', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: BUILD_A };
  recorder = start({ enabled: true }, lowdefy);
  recorder.pageview({ path: 'tickets' });
  recorder.pageShown(page('tickets'));
  recorder.pageview({ path: 'broken' });
  recorder.pageview({ path: 'tickets' });
  await window.__lowdefyRecorder.flush();
  expect(sentBodies()[0].records.map((record) => [record.kind, record.page_id])).toEqual([
    ['pageview', 'tickets'],
    ['pageview', 'tickets'],
  ]);
});

test('a visit to a patterned page records the page and path values of the page shown', async () => {
  const lowdefy = { user: { roles: ['admin'] }, _devBuildId: BUILD_A };
  recorder = start({ enabled: true }, lowdefy);
  recorder.pageview({ path: 'tickets/s/1' });
  recorder.pageShown(page('ticket', { space: 's', ticket_id: '1' }));
  recorder.pageview({ path: 'tickets/s/2' });
  recorder.pageShown(page('ticket', { space: 's', ticket_id: '2' }));
  await window.__lowdefyRecorder.flush();
  expect(
    sentBodies()[0].records.map((record) => [record.kind, record.page_id, record.path_params])
  ).toEqual([
    ['pageview', 'ticket', { space: 's', ticket_id: '1' }],
    ['pageview', 'ticket', { space: 's', ticket_id: '2' }],
  ]);
});

test('a page shown with no pageview pending records nothing', async () => {
  recorder = start();
  recorder.pageShown(page('tickets'));
  await window.__lowdefyRecorder.flush();
  expect(fetch).not.toHaveBeenCalled();
});
