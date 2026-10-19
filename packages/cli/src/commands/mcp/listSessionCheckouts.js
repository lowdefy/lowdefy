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

import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import isLinkedWorktree from './isLinkedWorktree.js';
import realPathOrNull from './realPathOrNull.js';

const execFileAsync = promisify(execFile);

const GIT_TIMEOUT_MS = 5000;

function git({ args, cwd }) {
  return execFileAsync('git', args, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }).then(
    ({ stdout }) => stdout
  );
}

// The checkouts an agent session may act on: the one it started in and every
// worktree of that repository, listed fresh on each call because agents add
// worktrees while a session runs. Outside a git repository the session's own
// directory is the only checkout.
async function listSessionCheckouts({ sessionRoot }) {
  let listing;
  let commonDir;
  try {
    [listing, commonDir] = await Promise.all([
      git({ args: ['worktree', 'list', '--porcelain'], cwd: sessionRoot }),
      git({ args: ['rev-parse', '--git-common-dir'], cwd: sessionRoot }),
    ]);
  } catch {
    return [sessionRoot];
  }
  commonDir = realPathOrNull(path.resolve(sessionRoot, commonDir.trim()));
  if (commonDir === null) {
    return [sessionRoot];
  }
  const worktrees = listing
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => realPathOrNull(line.slice('worktree '.length)))
    .filter((worktree) => worktree !== null && isLinkedWorktree({ worktree, commonDir }));
  return [...new Set([sessionRoot, ...worktrees])];
}

export default listSessionCheckouts;
