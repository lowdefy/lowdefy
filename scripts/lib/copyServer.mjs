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

import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo']);

function copyServer({ sourceDir, targetDir }) {
  // Only skip the top-level build/ directory (generated artifacts).
  // Nested build/ directories like lib/build/ contain static source files.
  const topLevelBuildDir = path.join(sourceDir, 'build');

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    filter: (src) => {
      if (src === topLevelBuildDir) return false;
      const basename = path.basename(src);
      if (SKIP_DIRS.has(basename) && src !== sourceDir) return false;
      return true;
    },
  });
}

export default copyServer;
