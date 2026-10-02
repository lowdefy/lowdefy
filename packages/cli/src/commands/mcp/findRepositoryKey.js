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

import isLinkedWorktree from './isLinkedWorktree.js';
import readGitLink from './readGitLink.js';
import realPathOrNull from './realPathOrNull.js';

function readCommonDir({ adminDir }) {
  let content;
  try {
    content = fs.readFileSync(path.join(adminDir, 'commondir'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    return null;
  }
  return realPathOrNull(path.resolve(adminDir, content.trim()));
}

// The repository a checkout root belongs to, as the trust list names it: the
// real path of its git common directory, the one directory every worktree of a
// repository shares in every layout git supports (<clone>/.git, a bare
// foo.git with worktrees beside it, a --separate-git-dir directory). Null when
// root has no .git, or when it is a linked worktree whose admin directory does
// not link back to it (a pruned worktree's reused path, a copied .git file).
// Read as files: git is never run in a directory the agent chose.
function findRepositoryKey({ root }) {
  const dotGit = path.join(root, '.git');
  let stat;
  try {
    stat = fs.statSync(dotGit);
  } catch {
    return null;
  }
  if (stat.isDirectory()) {
    return realPathOrNull(dotGit);
  }
  if (!stat.isFile()) {
    return null;
  }
  const adminDir = readGitLink({ filePath: dotGit });
  if (adminDir === null) {
    return null;
  }
  const commonDir = readCommonDir({ adminDir });
  // No commondir: the .git file names the repository's own git directory, as
  // a --separate-git-dir clone's main checkout does.
  if (commonDir === undefined) {
    return adminDir;
  }
  if (commonDir === null || !isLinkedWorktree({ worktree: root, commonDir })) {
    return null;
  }
  return commonDir;
}

export default findRepositoryKey;
