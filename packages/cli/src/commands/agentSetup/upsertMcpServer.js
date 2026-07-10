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

// Merges the "lowdefy-docs" MCP server into an existing .mcp.json instead of overwriting it,
// since a project's .mcp.json may already declare other MCP servers.
async function upsertMcpServer({ context, projectDirectory, port }) {
  const mcpJsonPath = path.join(projectDirectory, '.mcp.json');
  const existing = await readFile(mcpJsonPath);
  const mcpServerEntry = buildMcpServerEntry({ port });

  if (type.isNone(existing)) {
    const mcpJson = { mcpServers: { 'lowdefy-docs': mcpServerEntry } };
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
      "Could not parse existing '.mcp.json' as JSON - leaving it unchanged. Add the 'lowdefy-docs' MCP server manually:\n" +
        JSON.stringify({ mcpServers: { 'lowdefy-docs': mcpServerEntry } }, null, 2)
    );
    return;
  }

  mcpJson.mcpServers = mcpJson.mcpServers ?? {};
  const currentEntry = mcpJson.mcpServers['lowdefy-docs'];
  if (!type.isNone(currentEntry)) {
    if (currentEntry.url === mcpServerEntry.url) {
      context.logger.info(
        "'.mcp.json' already has a 'lowdefy-docs' MCP server - leaving it unchanged."
      );
    } else {
      // Likely a second Lowdefy app in the same project, or a stale port.
      context.logger.warn(
        `'.mcp.json' already has a 'lowdefy-docs' MCP server pointing at '${currentEntry.url}', expected '${mcpServerEntry.url}' - leaving it unchanged. Rerun with --port to match, or add this app manually under a different server name.`
      );
    }
    return;
  }

  mcpJson.mcpServers['lowdefy-docs'] = mcpServerEntry;
  await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
  context.logger.info("Added the 'lowdefy-docs' MCP server to '.mcp.json'.");
  warnStaleConfigDirMcpJson({ context, projectDirectory });
}

export default upsertMcpServer;
