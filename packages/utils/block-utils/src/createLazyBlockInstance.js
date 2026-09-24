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

import changeLazyBlockLoadsInFlight from './changeLazyBlockLoadsInFlight.js';
import createLazyMethodQueue from './createLazyMethodQueue.js';

// Per-mount state of a lazy block. It is created during the first render, not
// in an effect: when the module is already loaded the implementation's effects
// register methods before the wrapper's own mount effect runs.
function createLazyBlockInstance({ loader }) {
  const { Component, promise } = loader.getImplementation();
  const queue = createLazyMethodQueue();
  let waiting = false;
  let settled = false;

  // Counted from mount rather than from the import, so readiness checks wait
  // for lazy blocks that are on screen, not for preloads nobody is showing.
  function mount() {
    if (!settled) {
      waiting = true;
      changeLazyBlockLoadsInFlight(1);
    }
  }

  function settle() {
    settled = true;
    if (waiting) {
      waiting = false;
      changeLazyBlockLoadsInFlight(-1);
    }
  }

  return { Component, mount, promise, queue, settle };
}

export default createLazyBlockInstance;
