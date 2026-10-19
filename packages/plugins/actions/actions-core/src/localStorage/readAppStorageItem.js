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

// Reads the value under the app's key. A value set before keys were kept per app sits under the
// bare key: the first read moves it to the app's key and removes the bare one.
function readAppStorageItem({ appKey, key, storage }) {
  const item = storage.getItem(appKey);
  if (!type.isNone(item)) {
    return item;
  }
  const legacyItem = storage.getItem(key);
  if (type.isNone(legacyItem)) {
    return null;
  }
  try {
    storage.setItem(appKey, legacyItem);
    storage.removeItem(key);
  } catch {
    // A full quota keeps the value where it is; it is still read from the bare key.
  }
  return legacyItem;
}

export default readAppStorageItem;
