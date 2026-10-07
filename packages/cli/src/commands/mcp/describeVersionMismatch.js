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

import findGitRoot from './findGitRoot.js';

// What to tell an agent whose `lowdefy mcp` and dev server run different
// Lowdefy versions: both versions and how to bring the shim to the app's.
// `cliDirectory` is the CLI package `lowdefy mcp` runs from. Installed into
// node_modules or the npx cache it is a pinned version, which agent-setup
// moves; anywhere else it is a checkout of Lowdefy, which needs installing and
// building.
function describeVersionMismatch({ cliVersion, serverVersion, cliDirectory, appRoot }) {
  const versions = `lowdefy mcp is ${cliVersion} but this dev server is ${serverVersion}, so tools and their options can differ.`;
  const installed = cliDirectory.split(path.sep).includes('node_modules');
  const fix = installed
    ? `To match them, run \`npx lowdefy agent-setup\` in ${appRoot} to pin lowdefy mcp to the app's Lowdefy version, then restart the agent session.`
    : `To match them, run \`pnpm install\` and \`pnpm build\` in ${findGitRoot({
        directory: cliDirectory,
      })}, then restart the agent session.`;
  return `${versions} ${fix}`;
}

export default describeVersionMismatch;
