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

import { StreamableHTTPTransport } from '@hono/mcp';
import { createMcpServer } from '@lowdefy/api';

// Stateless per-request MCP server over the app's configured endpoints and
// agents. The apiContext middleware has already resolved the caller (session
// or auth.strategies), so tool listing and calls are authorized per request.
async function mcpHandler(c) {
  const context = c.get('lowdefyContext');
  const server = await createMcpServer({ context });
  if (!server) {
    return c.json({ error: 'MCP is not configured.' }, 404);
  }
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
}

export default mcpHandler;
