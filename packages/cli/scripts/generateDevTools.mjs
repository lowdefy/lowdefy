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

// Writes the dev MCP tool list the `lowdefy mcp` shim serves at session start,
// before any dev server runs. It is generated from server-dev's
// devToolDefinitions through the same McpServer the dev server uses, so the
// JSON schemas are byte-for-byte what the running server would list - the two
// cannot drift, because this runs on every CLI build.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import devToolDefinitions, {
  INSTRUCTIONS,
} from '@lowdefy/server-dev/lib/docs/devToolDefinitions.js';

const outputPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/commands/mcp/devTools.json'
);

const server = new McpServer({ name: 'lowdefy-dev-tools', version: '1.0.0' });
Object.entries(devToolDefinitions).forEach(([name, definition]) => {
  server.registerTool(name, definition, () => ({ content: [] }));
});

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
const client = new Client({ name: 'generate-dev-tools', version: '1.0.0' });
await client.connect(clientTransport);
const { tools } = await client.listTools();
await client.close();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({ instructions: INSTRUCTIONS, tools }, null, 2)}\n`);
// eslint-disable-next-line no-console
console.log(`Wrote ${tools.length} dev tools to ${path.relative(process.cwd(), outputPath)}.`);
