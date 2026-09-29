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

import { type } from '@lowdefy/helpers';

import encodeViewParam from './encodeViewParam.js';
import getStorageKey from './getStorageKey.js';

function isEmptyPayload(payload) {
  return Object.keys(payload.view).length === 0 && type.isNone(payload.activeView);
}

// Writes the payload `{ view, activeView }`. The URL is replaced, never pushed: a view tweak is
// not a navigation, so Back still leaves the page.
function writePersistedView({ persist, payload }) {
  if (persist.storage === 'url') {
    const url = new URL(window.location.href);
    if (isEmptyPayload(payload)) {
      url.searchParams.delete(persist.key);
    } else {
      url.searchParams.set(persist.key, encodeViewParam(payload));
    }
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, '', url.href);
    }
    return;
  }
  try {
    window.localStorage.setItem(getStorageKey(persist.key), JSON.stringify(payload));
  } catch {
    // Blocked or full storage: the view lives for the session only.
  }
}

export default writePersistedView;
