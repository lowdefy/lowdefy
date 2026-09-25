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

import { spawnSync } from 'child_process';
import { wait } from '@lowdefy/helpers';

function isGroupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

// The hub starts every dev server as the leader of its own process group, so
// the group holds the package manager, any wrapper, the CLI, the manager and
// Vite. Signalling the group stops all of them and nothing else - never a
// process found by port or by name.
async function stopProcessGroup({ pid, graceMs = 5000 }) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F']);
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    return;
  }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    if (!isGroupAlive(pid)) {
      return;
    }
    await wait(100);
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    // Exited between the last check and the kill.
  }
}

export default stopProcessGroup;
