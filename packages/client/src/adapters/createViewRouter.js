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

import { parsePageId } from '@lowdefy/helpers';

import { serializeQuery } from './url.js';

// The address of a view ('/tickets/12?tab=notes') as a history entry: the
// pathname without basePath, and the query with its "?".
function parseAddress(address) {
  const [beforeHash] = address.split('#');
  const queryIndex = beforeHash.indexOf('?');
  if (queryIndex === -1) {
    return { pathname: beforeHash, search: '' };
  }
  return { pathname: beforeHash.slice(0, queryIndex), search: beforeHash.slice(queryIndex) };
}

// The router of a page shown as an MCP App view. It has the shape of the
// browser router (createRouter), so Link, setupLink and the engine use it
// unchanged, but it keeps its location and history itself: the frame a view
// runs in has the host's sandbox URL, which names no page, and its history is
// not the view's to write.
//
// path is the first address: the page path and query, starting with "/", with
// no basePath. A location's pathname carries basePath, as the browser's does.
//
// The frame's document is the host's loader, so there is nothing to load
// again: forceReload navigates like any other push. The host sizes the frame
// to the page, so the router scrolls nothing.
function createViewRouter({ basePath = '', path }) {
  const listeners = new Set();
  let entries = [parseAddress(path)];
  let index = 0;

  function getLocation() {
    const { pathname, search } = entries[index];
    return {
      path: parsePageId(pathname) ?? '',
      pathname: `${basePath}${pathname}`,
      search,
    };
  }

  function notify() {
    const location = getLocation();
    listeners.forEach((listener) => listener(location));
  }

  function navigate({ pathname, query, replace = false }) {
    const serializedQuery = serializeQuery(query);
    const entry = { pathname, search: serializedQuery === '' ? '' : `?${serializedQuery}` };
    if (replace) {
      entries = [...entries.slice(0, index), entry, ...entries.slice(index + 1)];
    } else {
      entries = [...entries.slice(0, index + 1), entry];
      index += 1;
    }
    notify();
  }

  function back() {
    if (index === 0) {
      return;
    }
    index -= 1;
    notify();
  }

  // A navigation that shows no page (the app refused it, or could not be
  // reached) is undone by restoring the history as it was when the shown page
  // was reached, so back still leads to the page before it.
  function restore(snapshot) {
    entries = snapshot.entries;
    index = snapshot.index;
    notify();
  }

  return {
    basePath,
    back,
    getLocation,
    restore,
    snapshot: () => ({ entries, index }),
    push: async (args) => navigate(args),
    replace: async (args) => navigate({ ...args, replace: true }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export default createViewRouter;
