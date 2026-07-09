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

function agentsMd({ port, devCommand }) {
  return `## Lowdefy

This project is a [Lowdefy](https://lowdefy.com) app: a web app defined in YAML config files
rather than hand-written code. Pages compose **blocks** (UI components), **operators** (logic
like \`_if\`, \`_get\`, \`_state\`), **actions** (event handlers), and **connections/requests**
(databases and APIs).

### Running the app

Start the development server with:

\`\`\`bash
${devCommand}
\`\`\`

This serves the app at \`http://localhost:${port}\` and hot-reloads on config changes.

### Looking up types, schemas, and docs

While the dev server is running, it serves documentation for every block, operator, action,
connection, and request type installed in this project (including local plugins) at
\`http://localhost:${port}/lowdefy-docs\`, and as MCP tools via the \`lowdefy-docs\` MCP server
(see \`.mcp.json\`).

**Never guess type names or properties.** Before writing or editing Lowdefy config:

1. List available types: call \`lowdefy_list_types\` (or \`GET /lowdefy-docs/{kind}\`, e.g.
   \`/lowdefy-docs/blocks\`) — this includes this project's local plugins.
2. Get the exact schema: call \`lowdefy_get_schema\` (or \`GET /lowdefy-docs/schema/{kind}/{type}\`).
3. See real usage: call \`lowdefy_get_examples\` (or \`GET /lowdefy-docs/examples/{type}\`).
4. Read concept docs or search: call \`lowdefy_get_doc\` or \`lowdefy_search_docs\` (or
   \`GET /lowdefy-docs/content/{slug}\`, \`GET /lowdefy-docs/search?q=...\`).
`;
}

export default agentsMd;
