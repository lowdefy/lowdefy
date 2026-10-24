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

import clearUserStorage from './clearUserStorage.js';
import listUserStorageKeys from './listUserStorageKeys.js';

// The person signed in (or nobody) may not be the one who left data on this browser: another
// person signed in on it, or a session ended without Logout running. Their keys go before any
// block reads storage.
function clearUserStorageOnOwnerChange({ basePath, sessionStorage, slug, storage, userId }) {
  let entries;
  try {
    entries = listUserStorageKeys({ basePath, slug, storage });
  } catch {
    // Storage the browser blocks holds nothing to clear.
    return;
  }
  if (entries.some((entry) => entry.userId !== userId)) {
    clearUserStorage({ basePath, keepUserId: userId, sessionStorage, slug, storage });
  }
}

export default clearUserStorageOnOwnerChange;
