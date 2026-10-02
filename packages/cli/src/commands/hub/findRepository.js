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
import findMainCheckout from '../mcp/findMainCheckout.js';

// The repository a directory is in, as the trust list names it: the path of
// its main checkout, whichever of its git worktrees the directory is in.
function findRepository({ directory }) {
  const resolved = path.resolve(directory);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory ${resolved} does not exist.`);
  }
  const root = findGitRoot({ directory: fs.realpathSync.native(resolved) });
  return findMainCheckout({ root });
}

export default findRepository;
