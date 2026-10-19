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

import v8 from 'node:v8';
import vm from 'node:vm';

// The manager is started without --expose-gc (by every launch path), so it
// turns the flag on itself and takes gc from a fresh context.
function exposeGc() {
  v8.setFlagsFromString('--expose-gc');
  return vm.runInNewContext('gc');
}

// The manager's heap grows two to three times during a config build and V8
// does not shrink it while the process is idle. One full GC delayMs after a
// build ends hands that slack back (about 50-150 ms of GC, never during a
// build: a build starting within delayMs cancels it).
function createIdleGc({ delayMs = 5000, gc = exposeGc() } = {}) {
  let timer = null;

  function onBuildingChange(building) {
    clearTimeout(timer);
    timer = null;
    if (building) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      gc();
    }, delayMs);
    // Never the reason the manager stays up.
    timer.unref();
  }

  return { onBuildingChange };
}

export default createIdleGc;
