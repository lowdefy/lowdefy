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

import closeWalkSession from './closeWalkSession.js';

const WALK_IDLE_MS = 120000;

// (Re)starts the walk's idle timer: a walk nobody steps or closes for
// idleMs (120 s by default) closes itself, so a crashed explorer leaves no
// browser context, data session or browser slot behind.
function armIdleClose({ walk, idleMs = WALK_IDLE_MS }) {
  clearTimeout(walk.idleTimer);
  walk.idleTimer = setTimeout(() => {
    closeWalkSession(walk).catch(() => {});
  }, idleMs);
  walk.idleTimer.unref?.();
}

export default armIdleClose;
