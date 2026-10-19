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

import listUserStorageKeys from './listUserStorageKeys.js';

// Removes every user key of this app not owned by keepUserId (all of them when keepUserId is
// null), and the session storage Lowdefy writes for the person browsing. Device preferences and
// the build reload markers stay.
function clearUserStorage({ basePath, keepUserId, slug, window }) {
  try {
    listUserStorageKeys({ basePath, slug, storage: window.localStorage })
      .filter(({ userId }) => type.isNone(keepUserId) || userId !== keepUserId)
      .forEach(({ key }) => window.localStorage.removeItem(key));
  } catch {
    // Storage the browser blocks holds nothing to clear.
  }
  try {
    window.sessionStorage.removeItem('lowdefy_scroll');
  } catch {
    // Storage the browser blocks holds nothing to clear.
  }
}

export default clearUserStorage;
