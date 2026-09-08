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

import { createUrl, parsePageId } from './url.js';

// History-API router backing the @lowdefy/client router contract:
// push({ pathname, query }), back(), basePath — plus subscribe() for the
// page component and sessionStorage-backed scroll restoration.
function createRouter({ basePath = '', window }) {
  const listeners = new Set();
  let entryKey = window.history.state?.lowdefyKey ?? `k${Date.now().toString(36)}`;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  if (!window.history.state?.lowdefyKey) {
    window.history.replaceState({ lowdefyKey: entryKey }, '', window.location.href);
  }

  function readScrollPositions() {
    try {
      return JSON.parse(window.sessionStorage.getItem('lowdefy_scroll') ?? '{}');
    } catch (e) {
      return {};
    }
  }

  function saveScrollPosition() {
    try {
      const positions = readScrollPositions();
      positions[entryKey] = { x: window.scrollX, y: window.scrollY };
      window.sessionStorage.setItem('lowdefy_scroll', JSON.stringify(positions));
    } catch (e) {
      // sessionStorage unavailable (private mode) — scroll restoration degrades gracefully.
    }
  }

  function restoreScrollPosition() {
    const position = readScrollPositions()[entryKey];
    window.requestAnimationFrame(() => {
      window.scrollTo(position?.x ?? 0, position?.y ?? 0);
    });
  }

  function getLocation() {
    return {
      pageId: parsePageId(window.location.href, basePath),
      pathname: window.location.pathname,
      search: window.location.search,
    };
  }

  function notify() {
    const location = getLocation();
    listeners.forEach((listener) => listener(location));
  }

  function navigate({ forceReload, pathname, query, replace = false, scroll = true }) {
    const url = createUrl({ basePath, pathname, query });
    if (forceReload) {
      window.location.assign(url);
      return;
    }
    saveScrollPosition();
    entryKey = `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    if (replace) {
      window.history.replaceState({ lowdefyKey: entryKey }, '', url);
    } else {
      window.history.pushState({ lowdefyKey: entryKey }, '', url);
    }
    notify();
    if (scroll) {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    }
  }

  window.addEventListener('popstate', (event) => {
    saveScrollPosition();
    entryKey = event.state?.lowdefyKey ?? `k${Date.now().toString(36)}`;
    notify();
    restoreScrollPosition();
  });

  return {
    basePath,
    back: () => window.history.back(),
    getLocation,
    push: async (args) => navigate(args),
    replace: async (args) => navigate({ ...args, replace: true }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default createRouter;
