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

// The name agent clients know `lowdefy mcp` by, in .mcp.json, in user-scope
// registrations and in Claude Code's approvals. Tool names derive from it
// (mcp__lowdefy__lowdefy_dev_start).
const MCP_SERVER_NAME = 'lowdefy';

// Names earlier agent-setup runs wrote. agent-setup renames them, so a project
// or user never runs two copies of the server.
const LEGACY_MCP_SERVER_NAMES = ['lowdefy-docs'];

export { LEGACY_MCP_SERVER_NAMES, MCP_SERVER_NAME };
