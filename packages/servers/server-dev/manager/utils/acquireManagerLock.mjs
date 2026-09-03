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

import fs from 'fs';
import path from 'path';

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to another user.
    return error.code === 'EPERM';
  }
}

// Two dev managers on one app race each other's incremental builds - both
// watch the config and rewrite the same build directory, so one wedges on a
// half-deleted pages dir (ENOTEMPTY) and keeps serving a stale build with no
// error anywhere. A pid lock in the server directory makes the second manager
// refuse loudly instead. A lock whose pid is no longer alive is stale (the
// manager crashed or was SIGKILLed) and is taken over.
function acquireManagerLock({ directory }) {
  const lockPath = path.join(directory, '.manager.lock');
  try {
    const holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (holder.pid !== process.pid && isPidAlive(holder.pid)) {
      return { acquired: false, holder, lockPath };
    }
  } catch {
    // No lock, or an unreadable one - either way it is not held.
  }
  fs.writeFileSync(
    lockPath,
    `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }, null, 2)}\n`
  );
  function release() {
    try {
      const holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      if (holder.pid === process.pid) {
        fs.rmSync(lockPath, { force: true });
      }
    } catch {
      // Already gone, or taken over after a crash - nothing to release.
    }
  }
  return { acquired: true, release, lockPath };
}

export default acquireManagerLock;
