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

// How a generated script invokes the project's own Lowdefy CLI. In a pnpm
// workspace 'npx lowdefy' does not resolve the workspace binary, so the
// invocation follows the lockfile. The lockfile may live at the workspace root
// in a monorepo, so both directories are checked.
function getLowdefyCommand({ configDirectory, projectDirectory = configDirectory }) {
  function lockfileExists(lockfileName) {
    return (
      fs.existsSync(path.join(configDirectory, lockfileName)) ||
      fs.existsSync(path.join(projectDirectory, lockfileName))
    );
  }
  if (lockfileExists('pnpm-lock.yaml')) {
    return 'pnpm exec lowdefy';
  }
  if (lockfileExists('yarn.lock')) {
    return 'yarn lowdefy';
  }
  return 'npx lowdefy';
}

export default getLowdefyCommand;
