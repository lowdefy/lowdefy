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

// While a rerun swaps the registration, the new entry is also held under this
// name, so a failed add never leaves the user with no Lowdefy server.
const STAGING_NAME = `${MCP_SERVER_NAME}-agent-setup`;

function removeUserRegistration({ name }) {
  return run({ args: ['mcp', 'remove', '--scope', 'user', name] });
}

function addArgsFor({ name, command, args }) {
  // The server is passed as a command and its arguments, never as JSON:
  // cmd.exe strips the quotes out of a JSON argument on Windows.
  return ['mcp', 'add', '--scope', 'user', name, '--', command, ...args];
}

function addUserRegistration({ name, command, args }) {
  const added = run({ args: addArgsFor({ name, command, args }) });
  return { added, failed: Boolean(added.error) || added.status !== 0 };
}

function addFailure({ added, note, steps }) {
  const commands = steps.map((stepArgs) => `claude ${stepArgs.join(' ')}`).join('\n');
  return new Error(
    `'claude mcp add' failed:\n${lastLines(
      added.stderr || added.error?.message
    )}\n${note} Register the server by hand with:\n${commands}`
  );
}

// On Windows claude runs through cmd.exe (it is often claude.cmd), which
// reports a missing command as an ordinary failure, not ENOENT, so it is
// looked up with where.exe first.
function isClaudeMissing() {
  if (process.platform === 'win32') {
    return spawnSync('where', ['claude'], { encoding: 'utf8', windowsHide: true }).status !== 0;
  }
  return run({ args: ['--version'] }).error?.code === 'ENOENT';
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

  if (isClaudeMissing()) {
    write(
      `Claude Code ('claude') is not on PATH. Add this server to your agent client's user-level MCP configuration:\n${JSON.stringify(
        { mcpServers: { [MCP_SERVER_NAME]: { type: 'stdio', command, args } } },
        null,
        2
      )}`
    );
    return;
  }

  // `claude mcp add` refuses a name that exists, and replacing it is the point
  // of a rerun. The new entry goes in under the staging name first: when
  // claude cannot add it, nothing has been removed yet. The final name is the
  // project .mcp.json entry's, so a project that has one gets one set of
  // tools, not two.
  const finalAddArgs = addArgsFor({ name: MCP_SERVER_NAME, command, args });
  const removeStagingArgs = ['mcp', 'remove', '--scope', 'user', STAGING_NAME];
  removeUserRegistration({ name: STAGING_NAME });
  const staged = addUserRegistration({ name: STAGING_NAME, command, args });
  if (staged.failed) {
    throw addFailure({
      added: staged.added,
      note: 'Your existing registration is unchanged.',
      steps: [['mcp', 'remove', '--scope', 'user', MCP_SERVER_NAME], finalAddArgs],
    });
  }
  removeUserRegistration({ name: MCP_SERVER_NAME });
  const registered = addUserRegistration({ name: MCP_SERVER_NAME, command, args });
  if (registered.failed) {
    throw addFailure({
      added: registered.added,
      note: `The server stays registered as '${STAGING_NAME}' meanwhile.`,
      steps: [finalAddArgs, removeStagingArgs],
    });
  }
  // Only once the new registration is in: a registration under another name
  // would be a second copy of the server.
  [STAGING_NAME, ...LEGACY_MCP_SERVER_NAMES].forEach((name) => removeUserRegistration({ name }));
  write(
    `Registered '${MCP_SERVER_NAME}' (lowdefy mcp ${cliVersion}) for every Claude Code session of this user.`
  );
  write(
    `A project whose .mcp.json defines '${MCP_SERVER_NAME}' uses that entry instead - rerun 'lowdefy agent-setup' in it if the entry still names a port or a node_modules path.`
  );
}

export default agentSetupUser;
