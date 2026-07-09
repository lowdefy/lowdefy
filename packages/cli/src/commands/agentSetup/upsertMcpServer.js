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
import { readFile, writeFile } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import buildMcpServerEntry from './buildMcpServerEntry.js';

// Merges the "lowdefy-docs" MCP server into an existing .mcp.json instead of overwriting it,
// since a project's .mcp.json may already declare other MCP servers.
async function upsertMcpServer({ context, port }) {
  const mcpJsonPath = path.join(context.directories.config, '.mcp.json');
  const existing = await readFile(mcpJsonPath);
  const mcpServerEntry = buildMcpServerEntry({ port });

  if (type.isNone(existing)) {
    const mcpJson = { mcpServers: { 'lowdefy-docs': mcpServerEntry } };
    await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
    context.logger.info("Created '.mcp.json'.");
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
  if (!type.isNone(mcpJson.mcpServers['lowdefy-docs'])) {
    context.logger.info(
      "'.mcp.json' already has a 'lowdefy-docs' MCP server - leaving it unchanged."
    );
    return;
  }

  mcpJson.mcpServers['lowdefy-docs'] = mcpServerEntry;
  await writeFile(mcpJsonPath, `${JSON.stringify(mcpJson, null, 2)}\n`);
  context.logger.info("Added the 'lowdefy-docs' MCP server to '.mcp.json'.");
}

export default upsertMcpServer;
