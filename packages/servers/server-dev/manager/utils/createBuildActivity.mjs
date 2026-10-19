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

import { wait } from '@lowdefy/helpers';

// Whether the manager is processing a change: a watcher batch from its first
// change until it is handled, a config build, a plugin install, a server
// restart until the new server answers. lowdefy_build_status({ wait: true })
// waits on it, so an agent reads the build - and talks to the server - that
// includes its last edit. onChange mirrors it into the instance record for
// readers in other processes; the proxy waits on it here, in the manager,
// because a restart ends every wait running in the dev server.
function createBuildActivity({ onChange }) {
  let active = 0;

  function setBusy(busy) {
    active += busy ? 1 : -1;
    onChange(active > 0);
  }

  async function track(task) {
    setBusy(true);
    try {
      return await task();
    } finally {
      setBusy(false);
    }
  }

  // An edit reaches a watcher a moment after it is saved, so the wait first
  // gives the watchers graceMs to start on it.
  async function waitForIdle({ graceMs = 1000, timeoutMs = 120000, intervalMs = 50 } = {}) {
    const start = Date.now();
    let sawBuild = false;
    while (Date.now() - start < graceMs) {
      if (active > 0) {
        sawBuild = true;
        break;
      }
      await wait(intervalMs);
    }
    while (active > 0) {
      if (Date.now() - start > timeoutMs) {
        return { settled: false, sawBuild, waitedMs: Date.now() - start };
      }
      await wait(intervalMs);
    }
    return { settled: true, sawBuild, waitedMs: Date.now() - start };
  }

  return { setBusy, track, waitForIdle };
}

export default createBuildActivity;
