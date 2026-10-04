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

import { removeWalk } from './walkSessions.js';

const FLUSH_CAP_MS = 2000;

async function teardown(walk) {
  clearTimeout(walk.idleTimer);
  try {
    if (walk.record && walk.runner !== null) {
      await walk.runner.actors.flushRecordings({ capMs: FLUSH_CAP_MS });
    }
    if (walk.runner !== null) {
      await walk.runner.actors.closeAll();
    }
    // After the actors: no browser request still carries the data cookie.
    if (walk.session !== null) {
      await walk.session.close();
    }
  } finally {
    walk.slot?.release();
    removeWalk(walk.walkId);
  }
}

// Closes a walk once, however many callers ask (the close route, the idle
// timer): flushes each actor's recorder (2 s cap) when the walk records,
// closes its browser contexts, then its data session, frees its browser slot
// and unregisters it, so errors stamped for it from here on are dropped.
function closeWalkSession(walk) {
  walk.closing ??= teardown(walk);
  return walk.closing;
}

export default closeWalkSession;
