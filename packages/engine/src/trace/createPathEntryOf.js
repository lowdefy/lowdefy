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

import { pageInstanceKey, parsePageId, type } from '@lowdefy/helpers';

import lookupPath from '../lookupPath.js';

// The path memory entry ({ pageId, pathParams, instanceKey }) of the page a URL shows, or null.
// It reads the URL, never lowdefy.pageId: posthog-js captures a history_change pageview inside its
// pushState patch, before the next page renders. The app root serves the configured home page.
function createPathEntryOf({ lowdefy }) {
  return function pathEntryOf(url) {
    const path = parsePageId(url, lowdefy.basePath);
    if (!type.isNull(path)) {
      // The registry can be used before the client initialises lowdefy and its path memory.
      const pathMemory = lowdefy.pathMemory ?? new Map();
      return lookupPath({ lowdefy: { pathMemory }, path });
    }
    if (lowdefy.home?.configured === true) {
      const { pageId } = lowdefy.home;
      return { pageId, pathParams: {}, instanceKey: pageInstanceKey({ pageId }) };
    }
    return null;
  };
}

export default createPathEntryOf;
