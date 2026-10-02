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

// The main checkout of the repository a checkout root belongs to: the root
// itself, or for a linked git worktree the checkout that owns its git
// directory. It names a repository across all of its worktrees. A worktree
// counts only when its admin directory links back to it, so a .git file
// pointing into another repository cannot borrow that repository's identity.
// Read as files: git is never run in a directory the agent chose.
function findMainCheckout({ root }) {
  const dotGit = path.join(root, '.git');
  let stat;
  try {
    stat = fs.lstatSync(dotGit);
  } catch {
    return root;
  }
  if (!stat.isFile()) {
    return root;
  }
  const adminDir = readGitLink({ filePath: dotGit });
  if (adminDir === null) {
    return root;
  }
  const commonDir = path.dirname(path.dirname(adminDir));
  if (!isLinkedWorktree({ worktree: root, commonDir })) {
    return root;
  }
  return path.dirname(commonDir);
}

export default findMainCheckout;
