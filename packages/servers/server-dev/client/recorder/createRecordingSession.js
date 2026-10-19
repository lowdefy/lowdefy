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

import { createTraceId, isTraceId } from '@lowdefy/helpers';

const STORAGE_KEY = 'lowdefy_dev_recording';
const IDLE_MS = 10 * 60 * 1000;

function readStored(storage) {
  try {
    const stored = JSON.parse(storage.getItem(STORAGE_KEY));
    if (isTraceId(stored?.id) && typeof stored.lastAt === 'number') return stored;
  } catch {
    // Blocked or malformed storage: start an unremembered session.
  }
  return null;
}

function writeStored(storage, value) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // A browser that blocks site data records under an unremembered session.
  }
}

// The tab's recording session. sessionStorage lives as long as the tab, so a
// session survives the reload a dev server restart triggers; a gap of more
// than 10 minutes starts a new one.
function createRecordingSession({ storage, now = Date.now }) {
  let current = null;

  function getId() {
    const time = now();
    const stored = readStored(storage) ?? current;
    const session =
      stored !== null && time - stored.lastAt <= IDLE_MS
        ? { id: stored.id, lastAt: time }
        : { id: createTraceId({ now: time }), lastAt: time };
    current = session;
    writeStored(storage, session);
    return session.id;
  }

  return { getId };
}

export default createRecordingSession;
