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

// sessionStorage key holding the URL this tab last reloaded after the first
// page's types failed to load.
const RELOADED_FOR_TYPES_KEY = 'lowdefy.reloadedForTypes';

// True the first time the first page's type chunks fail to load at a URL — a
// network blip, or HTML served from an older deploy whose chunks are gone — so
// the tab reloads once. A second failure at the same URL renders instead of
// looping, and clears the record so a later visit may retry.
function shouldReloadForTypes({ window }) {
  try {
    if (window.sessionStorage.getItem(RELOADED_FOR_TYPES_KEY) === window.location.href) {
      window.sessionStorage.removeItem(RELOADED_FOR_TYPES_KEY);
      return false;
    }
    window.sessionStorage.setItem(RELOADED_FOR_TYPES_KEY, window.location.href);
  } catch (error) {
    // Storage disabled: without the record the loop guard cannot work.
    return false;
  }
  return true;
}

export default shouldReloadForTypes;
