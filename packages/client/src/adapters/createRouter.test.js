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

import createRouter from './createRouter.js';

// Minimal fake window so history behavior is deterministic and
// navigation-dependent assertions don't hit jsdom's unimplemented navigation.
function createFakeWindow({ url = 'http://localhost/' } = {}) {
  const popstateListeners = [];
  const calls = { pushState: [], replaceState: [], back: 0, assign: [], scrollTo: [] };
  const storage = {};
  function makeLocation(href, base) {
    return Object.assign(new URL(href, base), {
      assign: (target) => calls.assign.push(target),
    });
  }
  const fakeWindow = {
    location: makeLocation(url),
    history: {
      state: null,
      scrollRestoration: 'auto',
      pushState(state, _, newUrl) {
        this.state = state;
        fakeWindow.location = makeLocation(newUrl, fakeWindow.location.href);
        calls.pushState.push(newUrl);
      },
      replaceState(state, _, newUrl) {
        this.state = state;
        fakeWindow.location = makeLocation(newUrl, fakeWindow.location.href);
        calls.replaceState.push(newUrl);
      },
      back() {
        calls.back += 1;
      },
    },
    addEventListener(name, fn) {
      if (name === 'popstate') popstateListeners.push(fn);
    },
    dispatchPopstate(state) {
      popstateListeners.forEach((fn) => fn({ state }));
    },
    requestAnimationFrame(fn) {
      fn();
    },
    scrollTo(x, y) {
      calls.scrollTo.push([x, y]);
    },
    scrollX: 0,
    scrollY: 0,
    sessionStorage: {
      getItem: (k) => storage[k] ?? null,
      setItem: (k, v) => {
        storage[k] = v;
      },
    },
    calls,
  };
  return fakeWindow;
}

test('push updates the url, notifies subscribers, and scrolls to top', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  const listener = jest.fn();
  router.subscribe(listener);
  await router.push({ pathname: '/page-1', query: 'a=1' });
  expect(window.calls.pushState).toEqual(['/page-1?a=1']);
  expect(listener).toHaveBeenCalledWith({
    pageId: 'page-1',
    pathname: '/page-1',
    search: '?a=1',
  });
  expect(window.calls.scrollTo).toContainEqual([0, 0]);
});

test('push prefixes basePath and getLocation strips it', async () => {
  const window = createFakeWindow({ url: 'http://localhost/admin/' });
  const router = createRouter({ basePath: '/admin', window });
  await router.push({ pathname: '/page-1' });
  expect(window.calls.pushState).toEqual(['/admin/page-1']);
  expect(router.getLocation().pageId).toBe('page-1');
});

test('replace uses replaceState instead of pushState', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  await router.replace({ pathname: '/page-2' });
  expect(window.calls.pushState).toEqual([]);
  // First replaceState call seeds the initial history entry key.
  expect(window.calls.replaceState).toContain('/page-2');
});

test('push with scroll false does not scroll to top', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  await router.push({ pathname: '/page-1', scroll: false });
  expect(window.calls.scrollTo).toEqual([]);
});

test('back delegates to history.back', () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  router.back();
  expect(window.calls.back).toBe(1);
});

test('popstate notifies subscribers with the new location', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  const listener = jest.fn();
  router.subscribe(listener);
  await router.push({ pathname: '/page-1' });
  listener.mockClear();
  window.location = new URL('http://localhost/page-0');
  window.dispatchPopstate({ lowdefyKey: 'k0' });
  expect(listener).toHaveBeenCalledWith({
    pageId: 'page-0',
    pathname: '/page-0',
    search: '',
  });
});

test('popstate restores the saved scroll position for the entry', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  const initialKey = window.history.state.lowdefyKey;
  window.scrollX = 0;
  window.scrollY = 250;
  await router.push({ pathname: '/page-1' });
  window.dispatchPopstate({ lowdefyKey: initialKey });
  expect(window.calls.scrollTo).toContainEqual([0, 250]);
});

test('forceReload assigns location instead of pushing history', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  await router.push({ pathname: '/page-1', forceReload: true });
  expect(window.calls.assign).toEqual(['/page-1']);
  expect(window.calls.pushState).toEqual([]);
});

test('unsubscribe removes the listener', async () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '', window });
  const listener = jest.fn();
  const unsubscribe = router.subscribe(listener);
  unsubscribe();
  await router.push({ pathname: '/page-1' });
  expect(listener).not.toHaveBeenCalled();
});

test('basePath is exposed on the router', () => {
  const window = createFakeWindow();
  const router = createRouter({ basePath: '/admin', window });
  expect(router.basePath).toBe('/admin');
});
