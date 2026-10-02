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

import buildUserMcpCommand from './buildUserMcpCommand.js';
import checkPinnedMcp from './checkPinnedMcp.js';
import { LEGACY_MCP_SERVER_NAMES, MCP_SERVER_NAME } from './mcpServerNames.js';

function write(line) {
  process.stdout.write(`${line}\n`);
}

function run({ args }) {
  return spawnSync('claude', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
}

function lastLines(text) {
  return (text ?? '').trim().split('\n').slice(-5).join('\n');
}

function removeUserRegistration({ name }) {
  return run({ args: ['mcp', 'remove', '--scope', 'user', name] });
}

// Registers `lowdefy mcp` for every Claude Code session of this user, so a
// session opened anywhere - a repository nobody set up, a fresh worktree with
// no node_modules, a directory outside any app - has the Lowdefy tools.
// lowdefy mcp finds the app from each call's directory, so one registration
// serves every project.
async function agentSetupUser({ cliVersion }) {
  const { command, args } = buildUserMcpCommand({ version: cliVersion });
  write(`Fetching lowdefy@${cliVersion} into the npm cache.`);
  checkPinnedMcp({
    version: cliVersion,
    hint: "Run agent-setup --user with a published lowdefy CLI that has 'lowdefy mcp', for example 'npx lowdefy@experimental agent-setup --user'.",
  });

  // `claude mcp add` refuses a name that exists; replacing it is the point of
  // a rerun. The same name as the project .mcp.json entry, so a project that
  // has one gets one set of tools, not two.
  const removed = removeUserRegistration({ name: MCP_SERVER_NAME });
  if (removed.error?.code === 'ENOENT') {
    write(
      `Claude Code ('claude') is not on PATH. Add this server to your agent client's user-level MCP configuration:\n${JSON.stringify(
        { mcpServers: { [MCP_SERVER_NAME]: { type: 'stdio', command, args } } },
        null,
        2
      )}`
    );
    return;
  }
  // The server is passed as a command and its arguments, never as JSON:
  // cmd.exe strips the quotes out of a JSON argument on Windows.
  const addArgs = ['mcp', 'add', '--scope', 'user', MCP_SERVER_NAME, '--', command, ...args];
  const added = run({ args: addArgs });
  if (added.error || added.status !== 0) {
    throw new Error(
      `'claude mcp add' failed:\n${lastLines(
        added.stderr || added.error?.message
      )}\nRegister the server by hand with:\nclaude ${addArgs.join(' ')}`
    );
  }
  // Only once the new registration is in: a registration under an old name
  // would be a second copy of the server, but removing it first could leave
  // the user with none.
  LEGACY_MCP_SERVER_NAMES.forEach((name) => removeUserRegistration({ name }));
  write(
    `Registered '${MCP_SERVER_NAME}' (lowdefy mcp ${cliVersion}) for every Claude Code session of this user.`
  );
  write(
    `A project whose .mcp.json defines '${MCP_SERVER_NAME}' uses that entry instead - rerun 'lowdefy agent-setup' in it if the entry still names a port or a node_modules path.`
  );
}

export default agentSetupUser;
