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

import readInstanceRecord from './readInstanceRecord.js';

// Vite can evaluate the app entry more than once (an SSR reload, the
// websocket upgrade path), and each evaluation calls this.
const STARTED = Symbol.for('lowdefy.server-dev.idleGc');

/*
Hands the child's V8 slack back once the server goes quiet: one full GC per
quiet period, when the activity the manager records in the instance record
(lastActivityAt, activeRequests, building) says nothing has used the server
for quietMs and nothing is in flight. It runs again only after activity
resumes (a newer lastActivityAt). A child started without --expose-gc has no
globalThis.gc and does nothing.
*/
function startIdleGc({
  configDirectory,
  gc = globalThis.gc,
  readInstance = readInstanceRecord,
  now = Date.now,
  pollMs = 5000,
  quietMs = 10000,
}) {
  if (globalThis[STARTED] === true || !type.isFunction(gc)) {
    return;
  }
  globalThis[STARTED] = true;
  let collectedFor = null;
  const interval = setInterval(() => {
    const record = readInstance({ configDirectory });
    if (type.isNone(record) || !type.isString(record.lastActivityAt)) {
      return;
    }
    if (record.building === true || (record.activeRequests ?? 0) > 0) {
      return;
    }
    if (record.lastActivityAt === collectedFor) {
      return;
    }
    if (now() - Date.parse(record.lastActivityAt) < quietMs) {
      return;
    }
    collectedFor = record.lastActivityAt;
    gc();
  }, pollMs);
  // Never the reason the child stays up.
  interval.unref();
}

export default startIdleGc;
