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

// The base directory for @vercel/nft tracing. nft ignores files above the base, and when the server
// directory is a pnpm workspace member the real dependency files live in the workspace root's
// node_modules/.pnpm virtual store (the server's node_modules entries are relative symlinks pointing
// up and out of the server directory). The base must therefore sit at or above the workspace root.
// A higher base is always safe — it only lengthens the relative paths inside the function.
function findTraceBase({ serverDirectory }) {
  let directory = serverDirectory;
  for (;;) {
    if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  // No workspace root found — fall back to the repository root so workspace-like layouts without
  // pnpm-workspace.yaml still trace, else the server directory itself (standalone install).
  directory = serverDirectory;
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
