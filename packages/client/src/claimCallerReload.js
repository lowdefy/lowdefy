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

// sessionStorage key holding when this tab last reloaded to follow its caller.
const RELOADED_FOR_CALLER_KEY = 'lowdefy.reloadedForCaller';

const RELOAD_INTERVAL_MS = 10000;

// True when this tab may reload because its caller changed (another person or
// organization, or the session ended), and records the reload. A tab reloads
// at most once per 10 seconds for its caller: if the freshly loaded page still
// disagrees with the server, reloading again would loop. Callers fail the call
// instead, so no data shows for the wrong caller either way.
function claimCallerReload({ window }) {
  const now = Date.now();
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_FOR_CALLER_KEY));
    if (Math.abs(now - last) < RELOAD_INTERVAL_MS) {
      return false;
    }
    window.sessionStorage.setItem(RELOADED_FOR_CALLER_KEY, String(now));
  } catch (error) {
    // Browsers with storage disabled throw on sessionStorage access. Without
    // the record the loop guard cannot work, so do not reload.
    return false;
  }
  return true;
}

export default claimCallerReload;
