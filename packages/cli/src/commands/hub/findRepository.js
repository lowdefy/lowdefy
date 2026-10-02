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

import findGitRoot from '../mcp/findGitRoot.js';
import findRepositoryKey from '../mcp/findRepositoryKey.js';

// The repository a directory is in, as the trust list names it: the real path
// of its git common directory, whichever of its git worktrees the directory
// is in.
function findRepository({ directory }) {
  const resolved = path.resolve(directory);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory ${resolved} does not exist.`);
  }
  const root = findGitRoot({ directory: fs.realpathSync.native(resolved) });
  const repository = findRepositoryKey({ root });
  if (repository === null) {
    throw new Error(
      `${resolved} is not in a git repository (or is a git worktree whose repository no longer links back to it). Only git repositories can be trusted. An app outside git is allowed for one agent session when the user answers the question lowdefy mcp asks, or when the agent session is started in it.`
    );
  }
  return repository;
}

export default findRepository;
