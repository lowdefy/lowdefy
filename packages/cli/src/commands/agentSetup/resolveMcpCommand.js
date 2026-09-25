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

// The lowdefy CLI installed for this app, found through node_modules the way
// Node resolves it but without following the package manager's symlinks - the
// symlinked path stays valid across upgrades, the real one names a version.
function findInstalledCli({ configDirectory }) {
  for (
    let directory = configDirectory;
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    const packageJsonPath = path.join(directory, 'node_modules', 'lowdefy', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.lowdefy;
      return {
        directory: path.dirname(packageJsonPath),
        entry: path.resolve(path.dirname(packageJsonPath), bin),
      };
    }
  }
  return null;
}

// The .mcp.json command for `lowdefy mcp`. Agent clients start stdio servers
// in the project root, and in a monorepo the app's lowdefy is not on the
// root's PATH (and `npx` falls back to a stale cached copy), so the entry
// runs the app's installed CLI by its path relative to the root. Each git
// worktree has its own node_modules at the same relative path, so one
// checked-in entry serves every worktree.
function resolveMcpCommand({ cliVersion, configDirectory, projectDirectory }) {
  const installed = findInstalledCli({ configDirectory });
  const hasMcp =
    installed !== null &&
    fs.existsSync(path.join(installed.directory, 'dist', 'commands', 'mcp', 'mcp.js'));
  if (hasMcp) {
    const relative = path.relative(projectDirectory, installed.entry).split(path.sep).join('/');
    return { entry: { command: 'node', args: [relative, 'mcp'] }, installed: true };
  }
  return {
    entry: { command: 'npx', args: ['--yes', `lowdefy@${cliVersion}`, 'mcp'] },
    installed: false,
  };
}

export default resolveMcpCommand;
