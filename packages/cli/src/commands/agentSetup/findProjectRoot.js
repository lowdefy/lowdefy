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

// Coding agents (Claude Code, Codex, Cursor) discover .mcp.json, .claude/
// skills, and instructions files from the directory they are launched in —
// in practice the git checkout root. In a monorepo where the Lowdefy app
// lives in a subdirectory, agent files written into the app directory are
// never found, so agent-setup targets the nearest ancestor containing .git
// instead. Falls back to the config directory when the app is not inside a
// git repository (single-directory projects keep today's behavior).
function findProjectRoot({ configDirectory }) {
  let directory = configDirectory;
  for (;;) {
    // .git is a directory in normal checkouts but a file in worktrees and
    // submodules — existsSync covers both.
    if (fs.existsSync(path.join(directory, '.git'))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return configDirectory;
    }
    directory = parent;
  }
}

export default findProjectRoot;
