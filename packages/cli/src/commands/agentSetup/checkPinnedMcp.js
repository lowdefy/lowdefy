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

import { spawnSync } from 'child_process';

import buildNpxMcpCommand from './buildNpxMcpCommand.js';

function lastLines(text) {
  return (text ?? '').trim().split('\n').slice(-5).join('\n');
}

// Runs the pinned `lowdefy mcp --help` through npx before an entry naming it
// is written. A pin npm cannot serve (an unpublished or workspace-linked
// version, or one from before `lowdefy mcp`) would leave every session that
// starts it without Lowdefy tools. It also downloads the version into the npm
// cache, so the first session does not wait for it.
function checkPinnedMcp({ version, hint }) {
  const { command, args } = buildNpxMcpCommand({ version });
  const result = spawnSync(command, [...args, '--help'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Could not run 'lowdefy mcp' from lowdefy@${version} on npm:\n${lastLines(
        result.stderr || result.error?.message
      )}\n${hint}`
    );
  }
}

export default checkPinnedMcp;
