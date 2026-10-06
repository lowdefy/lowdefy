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

import isPageReady from './isPageReady.js';

// isPageReady runs against `window` inside the browser, so each case installs
// a stub context on global.window and asserts the boolean.
function setWindow(context) {
  global.window = { lowdefy: { contexts: context === undefined ? {} : { 'page:home': context } } };
}

function settledContext({ blocks = {}, requests = {}, websockets = {} } = {}) {
  return {
    _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: blocks } },
    requests,
    websockets,
  };
}

const originalWindow = global.window;

afterEach(() => {
  global.window = originalWindow;
});

test('isPageReady returns false when the page context does not exist', () => {
  setWindow(undefined);

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady with a null pageId waits for the page the app shows', () => {
  global.window = { lowdefy: { contexts: { 'page:login': settledContext() } } };
  expect(isPageReady(null)).toBe(false);

  // A protected page redirected to sign in: the login page is what mounted.
  global.window.lowdefy.pageId = 'login';
  expect(isPageReady(null)).toBe(true);
  expect(isPageReady('dashboard')).toBe(false);
});

test('isPageReady returns false while a client navigation has not rendered the next page', () => {
  // A Link in onInit pushed the next URL; the page being left is still the
  // one window.lowdefy names, and its context has settled.
  global.window = {
    lowdefy: {
      pageId: 'guarded',
      contexts: { 'page:guarded': settledContext() },
      _devNavigating: true,
    },
  };
  expect(isPageReady(null)).toBe(false);
  expect(isPageReady('guarded')).toBe(false);

  // The next page rendered: window.lowdefy names it and waits on its context.
  global.window.lowdefy._devNavigating = false;
  global.window.lowdefy.pageId = 'home';
  expect(isPageReady(null)).toBe(false);
  global.window.lowdefy.contexts['page:home'] = settledContext();
  expect(isPageReady(null)).toBe(true);
});

test('isPageReady returns false when window.lowdefy is not defined', () => {
  global.window = {};

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns false while onInit has not finished', () => {
  setWindow({ _internal: { RootSlots: { map: {} } }, requests: {} });

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns false while onInitAsync has not finished', () => {
  setWindow({ _internal: { onInitDone: true, RootSlots: { map: {} } }, requests: {} });

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns false while the app onInitAsync has not finished', () => {
  setWindow(settledContext());
  global.window.lowdefy.appContext = { _internal: { onInitDone: true } };
  expect(isPageReady('home')).toBe(false);

  global.window.lowdefy.appContext._internal.onInitAsyncDone = true;
  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns false while a block onMountAsync event is loading', () => {
  setWindow(
    settledContext({
      blocks: { list: { Events: { events: { onMountAsync: { loading: true } } } } },
    })
  );

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns true when a block event has finished loading', () => {
  setWindow(
    settledContext({
      blocks: { list: { Events: { events: { onMountAsync: { loading: false } } } } },
    })
  );

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns false while a request is loading', () => {
  setWindow(settledContext({ requests: { get_users: [{ loading: true }] } }));

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns true when a request has resolved', () => {
  setWindow(settledContext({ requests: { get_users: [{ loading: false, response: [] }] } }));

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns false while a websocket channel has not connected', () => {
  setWindow(settledContext({ websockets: { orders: { connected: false, error: null } } }));

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns true when a websocket channel failed with an error', () => {
  setWindow(settledContext({ websockets: { orders: { connected: false, error: 'refused' } } }));

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns true when every websocket channel is connected', () => {
  setWindow(settledContext({ websockets: { orders: { connected: true, error: null } } }));

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns true for a settled page with blocks, requests and websockets', () => {
  setWindow(
    settledContext({
      blocks: { list: { Events: { events: { onMountAsync: { loading: false } } } } },
      requests: { get_users: [{ loading: false }] },
      websockets: { orders: { connected: true, error: null } },
    })
  );

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns true for a page with no blocks, requests or websockets', () => {
  setWindow({ _internal: { onInitDone: true, onInitAsyncDone: true } });

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns false while a lazy block on the page is still loading', () => {
  setWindow(settledContext());
  global.window.__lowdefyLazyLoads = 1;

  expect(isPageReady('home')).toBe(false);
});

test('isPageReady returns true once every lazy block has loaded', () => {
  setWindow(settledContext());
  global.window.__lowdefyLazyLoads = 0;

  expect(isPageReady('home')).toBe(true);
});

test('isPageReady returns true when no lazy block has mounted and the counter is absent', () => {
  setWindow(settledContext());

  expect(global.window.__lowdefyLazyLoads).toBeUndefined();
  expect(isPageReady('home')).toBe(true);
});
