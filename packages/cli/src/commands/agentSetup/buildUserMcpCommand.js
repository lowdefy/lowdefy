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

import buildNpxMcpCommand from './buildNpxMcpCommand.js';

// The user-scope registration is per machine, so it can name the platform's
// own launcher: Claude Code on native Windows cannot spawn npx (a .cmd file)
// without a shell. Project entries are shared across systems and stay plain
// npx.
function buildUserMcpCommand({ version }) {
  const { command, args } = buildNpxMcpCommand({ version });
  if (process.platform === 'win32') {
    return { command: 'cmd', args: ['/c', command, ...args] };
  }
  return { command, args };
}

export default buildUserMcpCommand;
