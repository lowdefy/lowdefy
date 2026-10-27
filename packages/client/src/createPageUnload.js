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

// How long the page may still be open after beforeunload before it counts as
// staying. beforeunload also fires for navigations that never leave the page:
// a file download, a mailto: or tel: link, a leave prompt the user cancels.
const STAY_TIMEOUT = 10000;

// Tells a fetch the browser cancels as the tab leaves the page (a reload, a
// link to another document, closing the tab) from a real network failure: both
// reject alike. The page is leaving from beforeunload, which comes before the
// browser starts the next document's load, or from pagehide, which covers
// leaves that skip it. A rejection while leaving is held, not thrown, as the
// request often reached the server and succeeded. If the page stays (no
// pagehide within STAY_TIMEOUT) or is shown again from the back-forward cache
// (pageshow), the held rejections are thrown after all, so the action fails as
// it would have and no loading state stays stuck.
function createPageUnload({ window }) {
  const held = new Set();
  let leaving = false;
  let stayTimer = null;

  function release() {
    leaving = false;
    clearTimeout(stayTimer);
    stayTimer = null;
    held.forEach(({ error, reject }) => reject(error));
    held.clear();
  }

  window.addEventListener('beforeunload', () => {
    leaving = true;
    clearTimeout(stayTimer);
    stayTimer = setTimeout(release, STAY_TIMEOUT);
  });
  window.addEventListener('pagehide', () => {
    leaving = true;
    clearTimeout(stayTimer);
    stayTimer = null;
  });
  window.addEventListener('pageshow', release);

  return {
    isLeaving: () => leaving,
    hold: (error) =>
      new Promise((resolve, reject) => {
        held.add({ error, reject });
      }),
  };
}

export default createPageUnload;
