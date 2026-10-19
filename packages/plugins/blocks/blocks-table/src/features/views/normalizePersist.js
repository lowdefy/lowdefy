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

// `persist: { key, storage }`, off unless set (D6, D15). A view kept in local storage is the
// signed-in person's, so it is kept under a user key: cleared at sign-out and never read by the
// next person on the browser.
function normalizePersist({ getUserStorageKey, persist }) {
  if (type.isNone(persist)) return null;
  if (!type.isObject(persist) || !type.isString(persist.key) || persist.key === '') {
    throw new Error(`Table persist requires a "key" string. Received ${JSON.stringify(persist)}.`);
  }
  if (persist.storage === 'url') {
    return { key: persist.key, storage: 'url', storageKey: null };
  }
  return {
    key: persist.key,
    storage: 'local',
    storageKey: getUserStorageKey(`lowdefy-table:${persist.key}`),
  };
}

export default normalizePersist;
