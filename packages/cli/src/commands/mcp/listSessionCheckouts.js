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
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GIT_TIMEOUT_MS = 5000;

function git({ args, cwd }) {
  return execFileAsync('git', args, { cwd, timeout: GIT_TIMEOUT_MS, windowsHide: true }).then(
    ({ stdout }) => stdout
  );
}

function realPath(filePath) {
  try {
    return fs.realpathSync.native(filePath);
  } catch {
    return null;
  }
}

// The path a gitdir link names: a worktree's .git file ("gitdir: <admin dir>",
// relative to the worktree) or an admin dir's gitdir file (the worktree's .git,
// relative to the admin dir). Read as files: git is never run in a directory
// the agent chose.
function readLink({ filePath }) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  const target = content.replace(/^gitdir:\s*/, '').trim();
  return target === '' ? null : realPath(path.resolve(path.dirname(filePath), target));
}

// Whether a directory git lists as a worktree is still that worktree. git
// keeps listing a worktree whose directory was deleted until it is pruned, so
// a directory later created at that path - a fresh clone, say - is listed as
// the repository's worktree. Only a directory whose .git is the repository's
// own git directory (the main worktree), or a .git file linked both ways with
// one of its worktrees/<name> admin directories, counts.
function isLinkedWorktree({ worktree, commonDir }) {
  const dotGit = path.join(worktree, '.git');
  let stat;
  try {
    stat = fs.lstatSync(dotGit);
  } catch {
    return false;
  }
  if (stat.isDirectory()) {
    return realPath(dotGit) === commonDir;
  }
  if (!stat.isFile()) {
    return false;
  }
  const adminDir = readLink({ filePath: dotGit });
  return (
    adminDir !== null &&
    path.dirname(adminDir) === path.join(commonDir, 'worktrees') &&
    readLink({ filePath: path.join(adminDir, 'gitdir') }) === realPath(dotGit)
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
  commonDir = realPath(path.resolve(sessionRoot, commonDir.trim()));
  if (commonDir === null) {
    return [sessionRoot];
  }
  const worktrees = listing
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => realPath(line.slice('worktree '.length)))
    .filter((worktree) => worktree !== null && isLinkedWorktree({ worktree, commonDir }));
  return [...new Set([sessionRoot, ...worktrees])];
}

export default listSessionCheckouts;
