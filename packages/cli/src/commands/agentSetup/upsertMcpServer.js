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
import { fileURLToPath } from 'url';
import { readFile, writeFile } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import buildMcpServerEntry from './buildMcpServerEntry.js';
import checkPinnedMcp from './checkPinnedMcp.js';
import { MCP_SERVER_NAME } from './mcpServerNames.js';

// A .mcp.json left in the app subdirectory by a pre-monorepo-fix run of
// agent-setup is never discovered by agents launched from the project root.
function warnStaleConfigDirMcpJson({ context, projectDirectory }) {
  const configDirectory = context.directories.config;
  if (projectDirectory === configDirectory) {
    return;
  }
  if (fs.existsSync(path.join(configDirectory, '.mcp.json'))) {
    context.logger.warn(
      `Found a '.mcp.json' in '${configDirectory}' - agents launched from the project root will not discover it. If it only contains the '${MCP_SERVER_NAME}' or 'lowdefy-docs' server, it can be removed.`
    );
  }
}

// Entries written by earlier agent-setup runs, or by hand per port
// (lowdefy-3010, ...): each pins one dev server on one port.
const PORT_PINNED_URL = /^http:\/\/(localhost|127\.0\.0\.1):\d+\/lowdefy-docs\/mcp\/?$/;

function isPortPinned(entry) {
  return type.isString(entry?.url) && PORT_PINNED_URL.test(entry.url);
}

function describeCommand(entry) {
  if (type.isString(entry.url)) {
    return entry.url;
  }
  return [entry.command, ...(entry.args ?? [])].join(' ');
}

// Points the "lowdefy" server at `lowdefy mcp` over stdio, pinned to the
// version of the CLI running agent-setup, and removes port-pinned Lowdefy
// entries, which the stdio server replaces for every app and worktree. Other
// servers are left alone.
async function upsertMcpServer({ context, projectDirectory }) {
  const mcpJsonPath = path.join(projectDirectory, '.mcp.json');
  const existing = await readFile(mcpJsonPath);
  const { entry, version } = buildMcpServerEntry({ cliVersion: context.cliVersion });
  // The entry is committed for teammates, so a pin npm cannot serve is
  // refused before anything is written. A contributor running their own build
  // of the CLI overrides the entry for themselves in Claude Code's local
  // scope, which outranks the project one and is never committed.
  const cliEntry = fileURLToPath(new URL('../../index.js', import.meta.url));
  context.logger.info(`Checking that npm can run lowdefy@${version} mcp.`);
  checkPinnedMcp({
    version,
    hint: `'.mcp.json' was not written: it is committed, and an entry npm cannot run leaves every agent session started from it without Lowdefy tools. It pins the version of the CLI running agent-setup (${version}), which must be published on npm: rerun agent-setup from a published version, such as \`npx lowdefy@<app version> agent-setup\`. To use your own build of the CLI, override the entry for yourself only:\nclaude mcp add --scope local ${MCP_SERVER_NAME} -- node ${cliEntry} mcp`,
  });

  if (type.isNone(existing)) {
    const mcpJson = { mcpServers: { [MCP_SERVER_NAME]: entry } };
    await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
    context.logger.info("Created '.mcp.json'.");
    warnStaleConfigDirMcpJson({ context, projectDirectory });
    return;
  }

  let mcpJson;
  try {
    mcpJson = JSON.parse(existing);
  } catch {
    context.logger.warn(
      `Could not parse existing '.mcp.json' as JSON - leaving it unchanged. Add the '${MCP_SERVER_NAME}' MCP server manually:\n` +
        JSON.stringify({ mcpServers: { [MCP_SERVER_NAME]: entry } }, null, 2)
    );
    return;
  }

  mcpJson.mcpServers = mcpJson.mcpServers ?? {};
  const removed = Object.keys(mcpJson.mcpServers).filter(
    (name) => name !== MCP_SERVER_NAME && isPortPinned(mcpJson.mcpServers[name])
  );
  removed.forEach((name) => delete mcpJson.mcpServers[name]);

  const current = mcpJson.mcpServers[MCP_SERVER_NAME];
  if (JSON.stringify(current) === JSON.stringify(entry) && removed.length === 0) {
    context.logger.info(
      `'.mcp.json' already runs 'lowdefy mcp' as '${MCP_SERVER_NAME}' - leaving it unchanged.`
    );
    return;
  }

  mcpJson.mcpServers[MCP_SERVER_NAME] = entry;
  await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
  if (type.isNone(current)) {
    context.logger.info(`Added the '${MCP_SERVER_NAME}' MCP server to '.mcp.json'.`);
  } else if (isPortPinned(current)) {
    context.logger.info(
      `Replaced the port-pinned '${MCP_SERVER_NAME}' server (${current.url}) in '.mcp.json' with 'lowdefy mcp', which finds each worktree's dev server itself.`
    );
  } else {
    context.logger.info(`Updated the '${MCP_SERVER_NAME}' MCP server in '.mcp.json'.`);
  }
  // The command is committed for the whole team, so a changed one is named,
  // with why the pinned npx form replaces it.
  if (!type.isNone(current) && !isPortPinned(current)) {
    const before = describeCommand(current);
    const after = describeCommand(entry);
    if (before !== after) {
      context.logger.info(
        `Its command changed from '${before}' to '${after}': the pinned npx command also starts in a worktree that is not installed yet.`
      );
    }
  }
  if (removed.length > 0) {
    context.logger.info(
      `Removed port-pinned Lowdefy MCP servers from '.mcp.json': ${removed.join(
        ', '
      )}. 'lowdefy mcp' serves every app and worktree.`
    );
  }
  warnStaleConfigDirMcpJson({ context, projectDirectory });
}

export default upsertMcpServer;
