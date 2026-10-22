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

// Keeps lowdefy.unloading true from the moment the tab starts leaving the page
// (a reload, a link to another document, closing the tab) until it is shown
// again. The browser cancels the page's in-flight fetches as it leaves, and they
// reject like a network failure; request reads the flag to tell the two apart.
// beforeunload comes first, before the browser starts the next document's load,
// and pagehide covers leaves that skip it. A page restored from the back-forward
// cache shows again (pageshow) and its requests are real once more.
function watchPageUnload({ lowdefy, window }) {
  lowdefy.unloading = false;
  function markUnloading() {
    lowdefy.unloading = true;
  }
  window.addEventListener('beforeunload', markUnloading);
  window.addEventListener('pagehide', markUnloading);
  window.addEventListener('pageshow', () => {
    lowdefy.unloading = false;
  });
}

export default watchPageUnload;
