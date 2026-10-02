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

// The same name as the project .mcp.json entry, so a project that has one
// gets one set of tools, not two.
const SERVER_NAME = 'lowdefy-docs';

function write(line) {
  process.stdout.write(`${line}\n`);
}

function run({ command, args }) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
}

function lastLines(text) {
  return (text ?? '').trim().split('\n').slice(-5).join('\n');
}

// Downloads the pinned version into the npm cache now, so the first session
// does not wait for it, and proves the version exists and has `lowdefy mcp`.
function prefetch({ entry, version }) {
  write(`Fetching lowdefy@${version} into the npm cache.`);
  const result = run({ command: entry.command, args: [...entry.args, '--help'] });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Could not run 'lowdefy mcp' from lowdefy@${version} on npm:\n${lastLines(
        result.stderr || result.error?.message
      )}\nRun agent-setup --user with a published lowdefy CLI that has 'lowdefy mcp', for example 'npx lowdefy@experimental agent-setup --user'.`
    );
  }
}

// Registers `lowdefy mcp` for every Claude Code session of this user, so a
// session opened anywhere - a repository nobody set up, a fresh worktree with
// no node_modules, a directory outside any app - has the Lowdefy tools.
// lowdefy mcp finds the app from each call's directory, so one registration
// serves every project.
async function agentSetupUser({ cliVersion }) {
  const entry = { type: 'stdio', ...buildNpxMcpCommand({ version: cliVersion }) };
  prefetch({ entry, version: cliVersion });

  // add-json refuses a name that exists; replacing it is the point of a rerun.
  const removed = run({
    command: 'claude',
    args: ['mcp', 'remove', '--scope', 'user', SERVER_NAME],
  });
  if (removed.error?.code === 'ENOENT') {
    write(
      `Claude Code ('claude') is not on PATH. Add this server to your agent client's user-level MCP configuration:\n${JSON.stringify(
        { mcpServers: { [SERVER_NAME]: entry } },
        null,
        2
      )}`
    );
    return;
  }
  const added = run({
    command: 'claude',
    args: ['mcp', 'add-json', '--scope', 'user', SERVER_NAME, JSON.stringify(entry)],
  });
  if (added.error || added.status !== 0) {
    throw new Error(
      `'claude mcp add-json' failed:\n${lastLines(added.stderr || added.error?.message)}`
    );
  }
  write(
    `Registered '${SERVER_NAME}' (lowdefy mcp ${cliVersion}) for every Claude Code session of this user.`
  );
  write(
    `A project whose .mcp.json defines '${SERVER_NAME}' uses that entry instead - rerun 'lowdefy agent-setup' in it if the entry still names a port or a node_modules path.`
  );
}

export default agentSetupUser;
