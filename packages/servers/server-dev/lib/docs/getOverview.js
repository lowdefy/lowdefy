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

import getDocsManifest from './getDocsManifest.js';
import listPlugins from './listPlugins.js';
import readBuildArtifact from './readBuildArtifact.js';

function countKinds({ availableTypes }) {
  return {
    blocks: Object.keys(availableTypes.blocks ?? {}).length,
    operators: new Set([
      ...Object.keys(availableTypes.operators?.client ?? {}),
      ...Object.keys(availableTypes.operators?.server ?? {}),
    ]).size,
    actions: Object.keys(availableTypes.actions ?? {}).length,
    connections: Object.keys(availableTypes.connections ?? {}).length,
    requests: Object.keys(availableTypes.requests ?? {}).length,
  };
}

function getOverview() {
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const counts = countKinds({ availableTypes });
  const plugins = listPlugins();
  const manifest = getDocsManifest();
  const sections = [...new Set((manifest?.docs ?? []).map((doc) => doc.section))];

  const lines = [
    '# Lowdefy Docs for AI Coding Agents',
    '',
    'Lowdefy is a config-driven web framework: apps are YAML files composing **blocks** (UI components), **operators** (logic like `_if`, `_get`, `_state`), **actions** (event handlers), and **connections/requests** (databases and APIs).',
    '',
    'This server describes everything installed in THIS project — never guess type names or properties, look them up here first.',
    '',
    '## What is available',
    '',
    `- ${counts.blocks} block types, ${counts.operators} operators, ${counts.actions} actions, ${counts.connections} connections, ${counts.requests} request types (from ${plugins.length} plugin packages, including this project's local plugins).`,
    manifest
      ? `- ${manifest.docs.length} core documentation pages (sections: ${sections.join(', ')}).`
      : '- Core documentation package (@lowdefy/docs-content) is not installed.',
    '',
    '## How to use this (recommended order)',
    '',
    '1. **List what exists**: `GET /docs/blocks`, `/docs/operators`, `/docs/actions`, `/docs/connections`, `/docs/requests` — or the `lowdefy_list_types` MCP tool. Each entry links to its schema, examples, and doc.',
    '2. **Get the exact contract**: `GET /docs/schema/{kind}/{type}` (e.g. `/docs/schema/blocks/Button`) — or `lowdefy_get_schema`. JSON Schema of all properties.',
    '3. **See real usage**: `GET /docs/examples/{type}` — or `lowdefy_get_examples`. YAML examples for block types.',
    '4. **Read concept docs**: `GET /docs/content/{slug}` (e.g. `/docs/content/operators/_get`) — or `lowdefy_get_doc`. Start with `concepts/lowdefy-schema`, `concepts/blocks`, `concepts/events-and-actions`, `concepts/connections-and-requests`, `concepts/operators`.',
    '5. **Search**: `GET /docs/search?q=...` — or `lowdefy_search_docs`.',
    '6. **Plugin packages**: `GET /docs/plugins` lists every installed plugin; `GET /docs/plugin-doc/{package}` returns markdown a plugin ships itself (READMEs, guides).',
    '',
    '## Routes',
    '',
    '| Route | Purpose |',
    '| --- | --- |',
    '| `GET /docs` | This overview |',
    '| `GET /docs/{kind}` | List all available types of a kind (blocks, operators, actions, connections, requests, agents, notifications, websockets) |',
    '| `GET /docs/plugins` | Installed plugin packages and the types each provides |',
    '| `GET /docs/schema/{kind}/{type}` | JSON schema for a type |',
    '| `GET /docs/examples/{type}` | Example yaml for a block type |',
    '| `GET /docs/content/{slug}` | Core doc page as markdown |',
    '| `GET /docs/search?q={query}` | Search core docs |',
    '| `GET /docs/plugin-doc/{package}` | Markdown shipped inside a plugin package |',
    '| `ALL /docs/mcp` | MCP endpoint (streamable HTTP) exposing all of the above as tools |',
  ];
  return lines.join('\n');
}

export default getOverview;
