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

const SKIP = new Set(['node_modules', '.lowdefy', '.git', '.next', 'dist', '.vercel']);
const MAX_DEPTH = 4;

// Every Lowdefy app under the checkout root: directories holding a
// lowdefy.yaml. Monorepos keep several under apps/*. A directory holding its
// own .git entry is another checkout - git worktrees are often made inside the
// main one (.claude/worktrees/*, *-wt/) - and its apps are not this
// checkout's.
function findApps({ root }) {
  const apps = [];
  function visit(directory, depth) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    if (
      entries.some(
        (entry) => entry.isFile() && ['lowdefy.yaml', 'lowdefy.yml'].includes(entry.name)
      )
    ) {
      apps.push(directory);
    }
    if (depth === MAX_DEPTH) {
      return;
    }
    entries
      .filter((entry) => entry.isDirectory() && !SKIP.has(entry.name))
      .map((entry) => path.join(directory, entry.name))
      .filter((child) => !fs.existsSync(path.join(child, '.git')))
      .forEach((child) => visit(child, depth + 1));
  }
  visit(root, 0);
  return apps.sort();
}

export default findApps;
