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

import path from 'path';

// Rewrites a path relative to the parent workspace root so it points at the
// same file from directory. pnpm expands "~/" to the home directory and
// "${NAME}" to an environment variable, so those are left as they are.
function rebasePath({ directory, filePath, workspaceRoot }) {
  if (path.isAbsolute(filePath) || filePath.startsWith('~') || filePath.startsWith('$')) {
    return filePath;
  }
  return path.relative(directory, path.resolve(workspaceRoot, filePath)).split(path.sep).join('/');
}

export default rebasePath;
