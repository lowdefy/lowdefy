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

import userStoragePrefix from './userStoragePrefix.js';

// Every user key of this app in storage (the host's store), with its owner's user id (null for
// an anonymous visitor). Keys are read before any is removed, since removing shifts storage
// indexes.
function listUserStorageKeys({ basePath, slug, storage }) {
  const prefix = userStoragePrefix({ basePath, slug });
  const entries = [];
  storage.keys().forEach((key) => {
    if (key.startsWith(prefix)) {
      const owner = key.slice(prefix.length, key.indexOf(':', prefix.length));
      entries.push({ key, userId: owner === '' ? null : decodeURIComponent(owner) });
    }
  });
  return entries;
}

export default listUserStorageKeys;
