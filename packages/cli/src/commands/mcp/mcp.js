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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import createShim from './createShim.js';
import loadDevTools from './loadDevTools.js';

// `lowdefy mcp` - the stdio MCP server agent clients spawn per session. The
// client starts it, so the connection never fails for want of a running dev
// server, and nothing in it names a port. stdout carries the protocol: nothing
// else may write to it.
async function mcp({ cliVersion }) {
  const shim = createShim({ cliVersion, cwd: process.cwd(), devTools: loadDevTools() });
  const transport = new StdioServerTransport();
  async function exit() {
    await shim.close();
    process.exit(0);
  }
  transport.onclose = exit;
  process.stdin.on('end', exit);
  await shim.server.connect(transport);
}

export default mcp;
