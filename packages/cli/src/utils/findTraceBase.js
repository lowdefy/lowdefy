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

import findPnpmWorkspaceRoot from './findPnpmWorkspaceRoot.js';

// The base directory for @vercel/nft tracing. nft ignores files above the base, and when the server
// directory sits inside a pnpm workspace the files of its linked workspace plugins, and of their
// dependencies in the workspace root's node_modules/.pnpm virtual store, live up and out of the
// server directory. The base must therefore sit at or above the parent workspace root, even though
// the server installs as its own nested workspace. A higher base is always safe — it only lengthens
// the relative paths inside the function.
function findTraceBase({ serverDirectory }) {
  const parentWorkspaceRoot = findPnpmWorkspaceRoot(path.dirname(serverDirectory));
  if (parentWorkspaceRoot !== null) {
    return parentWorkspaceRoot;
  }
  if (fs.existsSync(path.join(serverDirectory, 'pnpm-workspace.yaml'))) {
    return serverDirectory;
  }
  // No workspace root found — fall back to the repository root so workspace-like layouts without
  // pnpm-workspace.yaml still trace, else the server directory itself (standalone install).
  let directory = serverDirectory;
  for (;;) {
    if (fs.existsSync(path.join(directory, '.git'))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return serverDirectory;
}

export default findTraceBase;
