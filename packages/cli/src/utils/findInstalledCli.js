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

// The lowdefy CLI installed for an app, found through node_modules the way
// Node resolves it (in a monorepo it is often hoisted to the workspace root).
// Null when the app's dependencies are not installed.
function findInstalledCli({ configDirectory }) {
  for (
    let directory = configDirectory;
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    const packageJsonPath = path.join(directory, 'node_modules', 'lowdefy', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const cliDirectory = path.dirname(packageJsonPath);
      return {
        directory: cliDirectory,
        hasMcp: fs.existsSync(path.join(cliDirectory, 'dist', 'commands', 'mcp', 'mcp.js')),
        version: packageJson.version,
      };
    }
  }
  return null;
}

export default findInstalledCli;
