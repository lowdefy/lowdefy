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

import readGitLink from './readGitLink.js';
import realPathOrNull from './realPathOrNull.js';

// Whether a directory git lists as a worktree is still that worktree. git
// keeps listing a worktree whose directory was deleted until it is pruned, so
// a directory later created at that path - a fresh clone, say - is listed as
// the repository's worktree. Only a directory whose .git is the repository's
// own git directory (the main worktree; in a --separate-git-dir clone a .git
// file naming it), or a .git file linked both ways with one of its
// worktrees/<name> admin directories, counts.
function isLinkedWorktree({ worktree, commonDir }) {
  const dotGit = path.join(worktree, '.git');
  let stat;
  try {
    stat = fs.lstatSync(dotGit);
  } catch {
    return false;
  }
  if (stat.isDirectory()) {
    return realPathOrNull(dotGit) === commonDir;
  }
  if (!stat.isFile()) {
    return false;
  }
  const adminDir = readGitLink({ filePath: dotGit });
  if (adminDir === commonDir) {
    return true;
  }
  return (
    adminDir !== null &&
    path.dirname(adminDir) === path.join(commonDir, 'worktrees') &&
    readGitLink({ filePath: path.join(adminDir, 'gitdir') }) === realPathOrNull(dotGit)
  );
}

export default isLinkedWorktree;
