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

import RELOADED_FOR_TYPES_KEY from './reloadedForTypesKey.js';

// The first page's types loaded, so a reload this tab made for them worked. A
// later failure at the same URL (a deploy since) may reload once again.
function clearReloadedForTypes({ window }) {
  try {
    window.sessionStorage.removeItem(RELOADED_FOR_TYPES_KEY);
  } catch (error) {
    // Storage disabled: nothing was recorded.
  }
}

export default clearReloadedForTypes;
