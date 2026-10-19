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

import realPathOrNull from './realPathOrNull.js';

// The path a gitdir link names: a worktree's .git file ("gitdir: <admin dir>",
// relative to the worktree) or an admin dir's gitdir file (the worktree's .git,
// relative to the admin dir). Read as files: git is never run in a directory
// the agent chose.
function readGitLink({ filePath }) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  const target = content.replace(/^gitdir:\s*/, '').trim();
  return target === '' ? null : realPathOrNull(path.resolve(path.dirname(filePath), target));
}

export default readGitLink;
