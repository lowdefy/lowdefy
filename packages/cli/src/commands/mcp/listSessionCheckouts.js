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
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GIT_TIMEOUT_MS = 5000;

// The checkouts an agent session may act on: the one it started in and every
// worktree of that repository, listed fresh on each call because agents add
// worktrees while a session runs. Removed worktrees git still lists (prunable)
// no longer exist and are left out. Outside a git repository the session's
// own directory is the only checkout.
async function listSessionCheckouts({ sessionRoot }) {
  let output;
  try {
    ({ stdout: output } = await execFileAsync('git', ['worktree', 'list', '--porcelain'], {
      cwd: sessionRoot,
      timeout: GIT_TIMEOUT_MS,
      windowsHide: true,
    }));
  } catch {
    return [sessionRoot];
  }
  const worktrees = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length))
    .filter((worktree) => fs.existsSync(worktree))
    .map((worktree) => fs.realpathSync(worktree));
  return [...new Set([sessionRoot, ...worktrees])];
}

export default listSessionCheckouts;
