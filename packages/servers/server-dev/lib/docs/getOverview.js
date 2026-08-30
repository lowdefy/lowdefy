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
    '1. **List what exists**: `GET /lowdefy-docs/blocks`, `/lowdefy-docs/operators`, `/lowdefy-docs/actions`, `/lowdefy-docs/connections`, `/lowdefy-docs/requests` — or the `lowdefy_list_types` MCP tool. Each entry links to its schema, examples, and doc.',
    '2. **Get the exact contract**: `GET /lowdefy-docs/schema/{kind}/{type}` (e.g. `/lowdefy-docs/schema/blocks/Button`) — or `lowdefy_get_schema`. JSON Schema of all properties.',
    '3. **See real usage**: `GET /lowdefy-docs/examples/{type}` — or `lowdefy_get_examples`. YAML examples for block types.',
    '4. **Read concept docs**: `GET /lowdefy-docs/content/{slug}` (e.g. `/lowdefy-docs/content/operators/_get`) — or `lowdefy_get_doc`. Start with `concepts/lowdefy-schema`, `concepts/blocks`, `concepts/events-and-actions`, `concepts/connections-and-requests`, `concepts/operators`.',
    '5. **Search**: `GET /lowdefy-docs/search?q=...` — or `lowdefy_search_docs`.',
    '6. **Plugin packages**: `GET /lowdefy-docs/plugins` lists every installed plugin; `GET /lowdefy-docs/plugin-doc/{package}` returns markdown a plugin ships itself (READMEs, guides).',
    '',
    'A `stale` field on a JSON response, a `> STALE:` banner on markdown, or an `X-Lowdefy-Stale` header means the last build FAILED and the served build is behind the source — this answer predates your latest edits. Call `GET /lowdefy-docs/build-status` and fix the errors before trusting anything else.',
    '',
    '## The feedback loop (after every edit)',
    '',
    'The dev server rebuilds automatically when config files change. After EVERY edit:',
    '',
    '1. **Check what broke**: `GET /lowdefy-docs/build-status` — or `lowdefy_build_status`. Current build errors and warnings with source file locations, plus recent browser runtime errors.',
    '2. **Verify the page**: `GET /lowdefy-docs/page-config/{pageId}` — or `lowdefy_get_page_config`. The fully built page config, or its structured build errors.',
    '3. **See it rendered**: `GET /lowdefy-docs/screenshot/{pageId}` — or `lowdefy_screenshot_page`. PNG of the page in headless Chromium.',
    '4. **Locate config**: `GET /lowdefy-docs/find/{id}?pageId=...` — or `lowdefy_find_config`. Which yaml file defines a page/block/request id.',
    '5. **Scaffold**: `lowdefy_scaffold_page` creates a canonical new page file (then register it in lowdefy.yaml).',
    '',
    '## Live state and testing',
    '',
    "1. **Inspect live state**: `GET /lowdefy-docs/inspect-state/{pageId}` — or `lowdefy_inspect_state`. The actual state, request results, and event log of a running page. Reads the developer's open browser tab when connected (ask them to interact, then inspect), else runs the page headless.",
    '2. **Evaluate operators**: `POST /lowdefy-docs/eval-operator` `{pageId, expression}` — or `lowdefy_eval_operator`. A REPL for config: run any operator expression against live page state. The operator goes in the `expression` body key (`operator` is accepted as an alias).',
    '3. **Run a request**: `POST /lowdefy-docs/run-request` `{pageId, requestId, payload}` — or `lowdefy_run_request`. Verify the data shape a request returns. Read-only types always run; writes need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml.',
    '4. **Understand the app**: `GET /lowdefy-docs/app-map` — or `lowdefy_app_map`. Every page, menu, connection, endpoint, agent, and websocket in one call.',
    '5. **Config checkpoints**: `POST /lowdefy-docs/checkpoints` `{label}` / `POST /lowdefy-docs/checkpoints/revert` `{id}` — or `lowdefy_checkpoint` / `lowdefy_revert_checkpoint`. Snapshot config files before risky changes; revert instantly.',
    "6. **State checkpoints**: `POST /lowdefy-docs/state-checkpoints/snapshot` `{pageId, name}` captures live page state + request responses into .lowdefy/state-checkpoints/<name>/ (gitignored — checkpoints contain user/session data); `POST /lowdefy-docs/state-checkpoints/load` `{name, mode}` restores it — 'registry-only' mode returns a ?_checkpoint URL a human can open to test the app in that exact state. `lowdefy_checkpoint_to_mocks` converts one into e2e mocks.yaml fixtures.",
    "7. **Restart the server**: `POST /lowdefy-docs/restart` `{reason}` — or `lowdefy_restart`. After editing a local plugin's server-side implementation, or when build-status looks stale. Answers before the restart lands: wait ~2s, then poll `GET /lowdefy-docs/build-status`. Local plugin server-side sources are also watched and restart the server automatically.",
    '',
    '## Visual feedback (annotation helper)',
    '',
    'The developer can press Cmd/Ctrl+/ in the running app to point at elements, draw, and comment; the helper copies an agent-readable feedback block to their clipboard which they paste into their agent session. Pasted blocks start with "Feedback:" and carry the blockId, resolved config file:line, drawn shapes (usable as screenshot clip geometry), and recent console entries — treat them as precise UI feedback.',
    '',
    '## Routes',
    '',
    '| Route | Purpose |',
    '| --- | --- |',
    '| `GET /lowdefy-docs` | This overview |',
    '| `GET /lowdefy-docs/{kind}` | List all available types of a kind (blocks, operators, actions, connections, requests, agents, notifications, websockets) |',
    '| `GET /lowdefy-docs/plugins` | Installed plugin packages and the types each provides |',
    '| `GET /lowdefy-docs/schema/{kind}/{type}` | JSON schema for a type |',
    '| `GET /lowdefy-docs/examples/{type}` | Example yaml for a block type |',
    '| `GET /lowdefy-docs/content/{slug}` | Core doc page as markdown |',
    '| `GET /lowdefy-docs/search?q={query}` | Search core docs |',
    '| `GET /lowdefy-docs/plugin-doc/{package}` | Markdown shipped inside a plugin package |',
    '| `GET /lowdefy-docs/build-status` | Current build errors/warnings + recent browser errors |',
    '| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors |',
    '| `GET /lowdefy-docs/screenshot/{pageId}` | PNG screenshot of the rendered page |',
    '| `GET /lowdefy-docs/find/{id}?pageId=` | Locate where a page/block/request id is defined |',
    '| `GET /lowdefy-docs/inspect-state/{pageId}?source=` | Live state/requests/eventLog of a running page (tab or headless) |',
    '| `POST /lowdefy-docs/eval-operator` | Evaluate an operator expression against live page state |',
    '| `POST /lowdefy-docs/run-request` | Execute a request with a test payload (read-only unless opted in) |',
    '| `GET /lowdefy-docs/app-map` | Whole-app graph: pages, menus, connections, endpoints, agents |',
    '| `GET/POST /lowdefy-docs/checkpoints` + `/revert` | Config-file checkpoints: list, create, revert |',
    '| `GET/POST /lowdefy-docs/state-checkpoints` + `/snapshot`, `/load` | State & data checkpoints: capture/restore live app state |',
    '| `POST /lowdefy-docs/restart` | Restart the dev server process (answers before the restart lands; poll build-status) |',
    '| `POST /lowdefy-feedback` | Annotation helper: enrich + format a feedback batch (overlay → clipboard) |',
    '| `ALL /lowdefy-docs/mcp` | MCP endpoint (streamable HTTP) exposing all of the above as tools |',
  ];
  return lines.join('\n');
}

export default getOverview;
