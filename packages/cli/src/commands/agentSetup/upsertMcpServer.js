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
import { readFile, writeFile } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import buildMcpServerEntry from './buildMcpServerEntry.js';

// A .mcp.json left in the app subdirectory by a pre-monorepo-fix run of
// agent-setup is never discovered by agents launched from the project root.
function warnStaleConfigDirMcpJson({ context, projectDirectory }) {
  const configDirectory = context.directories.config;
  if (projectDirectory === configDirectory) {
    return;
  }
  if (fs.existsSync(path.join(configDirectory, '.mcp.json'))) {
    context.logger.warn(
      `Found a '.mcp.json' in '${configDirectory}' - agents launched from the project root will not discover it. If it only contains the 'lowdefy-docs' server, it can be removed.`
    );
  }
}

const SERVER_NAME = 'lowdefy-docs';

// Entries written by earlier agent-setup runs, or by hand per port
// (lowdefy-3010, ...): each pins one dev server on one port.
const PORT_PINNED_URL = /^http:\/\/(localhost|127\.0\.0\.1):\d+\/lowdefy-docs\/mcp\/?$/;

function isPortPinned(entry) {
  return type.isString(entry?.url) && PORT_PINNED_URL.test(entry.url);
}

// Points the "lowdefy-docs" server at `lowdefy mcp` over stdio and removes
// port-pinned Lowdefy entries, which the stdio server replaces for every app
// and worktree. The key stays "lowdefy-docs" so tool names and the approvals
// clients store against them survive. Other servers are left alone.
async function upsertMcpServer({ context, projectDirectory }) {
  const mcpJsonPath = path.join(projectDirectory, '.mcp.json');
  const existing = await readFile(mcpJsonPath);
  const { entry, installed } = buildMcpServerEntry({
    cliVersion: context.cliVersion,
    configDirectory: context.directories.config,
    projectDirectory,
  });
  if (!installed) {
    context.logger.warn(
      `This app has no installed lowdefy CLI with 'lowdefy mcp', so '.mcp.json' runs '${
        entry.command
      } ${entry.args.join(
        ' '
      )}', which downloads on first use. Add lowdefy (this version or newer) to the app's devDependencies and rerun agent-setup for an instant, version-matched MCP server.`
    );
  }

  if (type.isNone(existing)) {
    const mcpJson = { mcpServers: { [SERVER_NAME]: entry } };
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
      `Could not parse existing '.mcp.json' as JSON - leaving it unchanged. Add the '${SERVER_NAME}' MCP server manually:\n` +
        JSON.stringify({ mcpServers: { [SERVER_NAME]: entry } }, null, 2)
    );
    return;
  }

  mcpJson.mcpServers = mcpJson.mcpServers ?? {};
  const removed = Object.keys(mcpJson.mcpServers).filter(
    (name) => name !== SERVER_NAME && isPortPinned(mcpJson.mcpServers[name])
  );
  removed.forEach((name) => delete mcpJson.mcpServers[name]);

  const current = mcpJson.mcpServers[SERVER_NAME];
  if (JSON.stringify(current) === JSON.stringify(entry) && removed.length === 0) {
    context.logger.info(
      `'.mcp.json' already runs 'lowdefy mcp' as '${SERVER_NAME}' - leaving it unchanged.`
    );
    return;
  }

  mcpJson.mcpServers[SERVER_NAME] = entry;
  await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
  if (type.isNone(current)) {
    context.logger.info(`Added the '${SERVER_NAME}' MCP server to '.mcp.json'.`);
  } else if (isPortPinned(current)) {
    context.logger.info(
      `Replaced the port-pinned '${SERVER_NAME}' server (${current.url}) in '.mcp.json' with 'lowdefy mcp', which finds each worktree's dev server itself.`
    );
  } else {
    context.logger.info(`Updated the '${SERVER_NAME}' MCP server in '.mcp.json'.`);
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
