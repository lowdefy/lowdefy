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

import schema from './schema.js';

// Mcp is a config-container connection — it stores MCP server transport config
// (url, command, args, etc.) and returns it as-is from create(). Unlike provider
// connections (Anthropic, OpenAI) that create SDK clients, Mcp just holds config
// that callAgent resolves and passes to handleAgentChat for MCP client creation.
function create({ connection }) {
  return connection ?? {};
}

const Mcp = { schema, create };
export default Mcp;
