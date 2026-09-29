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

import decodeViewParam from './decodeViewParam.js';
import getStorageKey from './getStorageKey.js';

function readStored({ persist }) {
  if (persist.storage === 'url') {
    return decodeViewParam(new URLSearchParams(window.location.search).get(persist.key));
  }
  // A private window, blocked site data or a malformed entry means no persisted view, never an
  // error.
  try {
    const text = window.localStorage.getItem(getStorageKey(persist.key));
    if (type.isNone(text)) return null;
    const payload = JSON.parse(text);
    return type.isObject(payload) ? payload : null;
  } catch {
    return null;
  }
}

// The persisted payload `{ view, activeView }`, or null.
function readPersistedView({ persist }) {
  if (type.isNone(persist)) return null;
  const payload = readStored({ persist });
  if (type.isNone(payload)) return null;
  return {
    view: type.isObject(payload.view) ? payload.view : {},
    activeView: type.isString(payload.activeView) ? payload.activeView : null,
  };
}

export default readPersistedView;
