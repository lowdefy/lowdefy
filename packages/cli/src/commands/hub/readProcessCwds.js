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
import { spawnSync } from 'child_process';

function readLinuxCwds({ pids }) {
  const cwds = new Map();
  pids.forEach((pid) => {
    try {
      cwds.set(pid, fs.readlinkSync(`/proc/${pid}/cwd`));
    } catch {
      // Exited, or not ours to read.
    }
  });
  return cwds;
}

// lsof -F prints one field per line: p<pid>, then f<fd> and n<name> for its cwd.
function readMacCwds({ pids }) {
  const cwds = new Map();
  const result = spawnSync('lsof', ['-a', '-d', 'cwd', '-p', pids.join(','), '-Fn'], {
    encoding: 'utf8',
    env: { ...process.env, LC_ALL: 'C' },
  });
  let pid = null;
  (result.stdout ?? '').split('\n').forEach((line) => {
    if (line.startsWith('p')) {
      pid = Number(line.slice(1));
      return;
    }
    if (line.startsWith('n') && pid !== null) {
      cwds.set(pid, line.slice(1));
    }
  });
  return cwds;
}

function readProcessCwds({ pids, platform = process.platform }) {
  if (pids.length === 0) {
    return new Map();
  }
  if (platform === 'linux') {
    return readLinuxCwds({ pids });
  }
  return readMacCwds({ pids });
}

export default readProcessCwds;
