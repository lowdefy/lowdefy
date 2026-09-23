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

// sessionStorage key holding the server build this tab last reloaded for.
const RELOADED_FOR_BUILD_KEY = 'lowdefy.reloadedForBuild';

// True when a page config fetched during SPA navigation came from a newer
// deploy than the bundle this tab is running, so the tab must do a full load
// to pick up the current bundle. Without this the new config can reference
// _js functions the old bundle never shipped, and the page throws mid-event.
//
// A tab reloads at most once per server build: if the freshly loaded bundle
// still disagrees with the server (a rolling deploy answering from mixed
// versions, a proxy caching old HTML), reloading again would loop forever.
// The old-config-on-old-bundle throw is the lesser failure in that case.
function shouldReloadForBuild({ bundleBuildId, serverBuildId, window }) {
  if (type.isNone(serverBuildId) || serverBuildId === bundleBuildId) {
    return false;
  }
  try {
    if (window.sessionStorage.getItem(RELOADED_FOR_BUILD_KEY) === serverBuildId) {
      return false;
    }
    window.sessionStorage.setItem(RELOADED_FOR_BUILD_KEY, serverBuildId);
  } catch (error) {
    // Browsers with storage disabled throw on sessionStorage access. Without
    // the once-per-build record the loop guard cannot work, so do not reload.
    return false;
  }
  return true;
}

export default shouldReloadForBuild;
