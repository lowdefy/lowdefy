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

import { parsePathPattern } from '@lowdefy/helpers';

import getDocsIndex from './getDocsIndex.js';
import getDocsManifest from './getDocsManifest.js';
import lowdefyConfig from '../build/config.js';
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

// The dev server mounts every route under config.basePath, the docs tools
// included, so an app with a basePath must tell agents the prefix.
function basePathLines() {
  const basePath = lowdefyConfig.basePath ?? '';
  if (basePath === '') return [];
  return [
    `This app sets \`config.basePath: ${basePath}\`, so every route below is served under it: \`GET ${basePath}/lowdefy-docs\`, \`${basePath}/lowdefy-docs/mcp\`, \`${basePath}/api/...\`.`,
    '',
  ];
}

// A page whose path has placeholders has one instance per set of values, so
// the page tools need pathParams to open it.
function patternedPageLines() {
  const routes = readBuildArtifact({ name: 'routes.json', deserialize: true });
  const patterned = routes.filter((route) =>
    parsePathPattern(route.path).some((segment) => segment.name !== undefined)
  );
  if (patterned.length === 0) return [];
  return [
    '## Pages with path parameters',
    '',
    'These pages are served at a URL pattern with placeholders. Pass `pathParams` with a value for each placeholder (e.g. `{"ticket_id": "1"}`) to `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_run_journey`. A live tab is read at the instance it shows without them.',
    '',
    ...patterned.map((route) => `- \`${route.pageId}\`: \`${route.path}\``),
    '',
  ];
}

// Plugin and module docs, with each module's pages named so an agent can
// read them without a search.
function appDocsLines() {
  const { entries } = getDocsIndex();
  const pluginDocs = entries.filter(
    (entry) => entry.source === 'plugin' || entry.source === 'local-plugin'
  );
  const moduleDocs = entries.filter((entry) => entry.source === 'module');
  const lines = [
    `- ${pluginDocs.length} plugin doc pages and ${moduleDocs.length} module doc pages from this app's own plugins and modules (search them with \`source\`, read them with \`lowdefy_get_doc\`).`,
  ];
  for (const entry of moduleDocs) {
    lines.push(`  - \`${entry.slug}\`: ${entry.title}`);
  }
  return lines;
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
    ...basePathLines(),
    ...patternedPageLines(),
    '## What is available',
    '',
    `- ${counts.blocks} block types, ${counts.operators} operators, ${counts.actions} actions, ${counts.connections} connections, ${counts.requests} request types (from ${plugins.length} plugin packages, including this project's local plugins).`,
    manifest
      ? `- ${manifest.docs.length} core documentation pages (sections: ${sections.join(', ')}).`
      : '- Core documentation package (@lowdefy/docs-content) is not installed.',
    ...appDocsLines(),
    '',
    '## How to use this (recommended order)',
    '',
    'Agents use these through the MCP endpoint (`/lowdefy-docs/mcp`, or `lowdefy mcp` set up by `lowdefy agent-setup`).',
    '',
    '1. **List what exists**: `lowdefy_list_types` with a kind (blocks, operators, actions, connections, requests, ...). Each entry names its package and doc slug.',
    "2. **Get the exact contract**: `lowdefy_get_schema` for the JSON Schema of a type's properties.",
    '3. **See real usage**: `lowdefy_get_examples` for YAML examples of a block type.',
    '4. **Read concept docs**: `lowdefy_get_doc` with a slug (e.g. `operators/_get`). Start with `concepts/lowdefy-schema`, `concepts/blocks`, `concepts/events-and-actions`, `concepts/connections-and-requests`, `concepts/operators`.',
    '5. **Search**: `lowdefy_search_docs`. The query is split into words and pages are ranked by how many match, title matches first. Each hit names its `source` (`core`, `plugin`, `local-plugin` or `module`), package and version; `source` narrows the search to one source.',
    '6. **Icons**: `lowdefy_search_icons`. Use a semantic name (`icon: edit`); otherwise use a Lucide name in PascalCase (`icon: Receipt`) found by search. Never invent a name. In HTML use `<i data-icon="edit"></i>`, `data-tooltip` and `data-popover`.',
    "7. **Plugin and module docs**: search and `lowdefy_get_doc` also cover the docs this app's own plugins and modules ship, local ones included: each README (`plugins/{package}`, `modules/{id}`), each `docs/*.md` file (`plugins/{package}/{file}`, `modules/{id}/{file}`), and for each module a generated page of the components, exports and vars its `module.lowdefy.yaml` declares (`modules/{id}/manifest`).",
    '',
    'A `stale` field on a JSON response, a `> STALE:` banner on markdown, an `X-Lowdefy-Stale` header or a tool result that begins with `STALE:` means the last build FAILED and the served build is behind the source — this answer predates your latest edits. Call `GET /lowdefy-docs/build-status` (`lowdefy_build_status`) and fix the errors before trusting anything else.',
    '',
    '## The feedback loop (after every edit)',
    '',
    'The dev server rebuilds automatically when config files change. After EVERY edit:',
    '',
    '1. **Check what broke**: `GET /lowdefy-docs/build-status?wait=true` — or `lowdefy_build_status` with `wait: true`, which answers once your latest edit has been processed and the pages it touched have been built. `build.status` is `ok` when the config builds and no page failed its latest build: `pages_failed` (with `build.failedPages` naming the pages) when a page failed its latest build and has not changed since, `error` when the config build fails. Then the build errors and warnings and the errors of each failed page, with source file locations, plus recent browser runtime errors. Errors from before the latest edit come apart under `earlierErrors`.',
    '   Or subscribe instead of polling: `GET /lowdefy-docs/events` streams `build`, `client_error`, `server_error` and `restart` events over SSE (MCP clients receive the same as `notifications/message` from logger `lowdefy`). A `build` event covers the config build only, so check build status for pages that fail to build.',
    '2. **Verify the page**: `GET /lowdefy-docs/page-config/{pageId}` — or `lowdefy_get_page_config`. The fully built page config, or its structured build errors.',
    '3. **See it rendered**: `lowdefy_screenshot_page`. PNG of the page in headless Chromium; `width` and `colorScheme` check a phone layout in dark mode.',
    '4. **Verify behaviour**: `POST /lowdefy-docs/journey` `{pageId, steps, user, urlQuery, state}` — or `lowdefy_run_journey`. Drive the page headless with declarative steps (`click`, `fill`, `select`, `press`, `back`, `goto`, `email`, `as`, `wait`, `screenshot`, `expect: { state | visible | text | url | title }`) and assert what happens. `user: "none"` injects no caller, so sign-up, sign-in and invitations run through the app\'s own auth. A failing step stops the journey and returns `passed: false` with `failure: { index, step, expected, actual, message }` and the final page `state` — data, not an error. `lowdefy_get_schema` with kind `journey-step` returns the step grammar.',
    '5. **Locate config**: `GET /lowdefy-docs/find/{id}?pageId=...` — or `lowdefy_find_config`. Which yaml file defines a page/block/request id.',
    '',
    '## Live state and testing',
    '',
    "1. **Inspect live state**: `lowdefy_inspect_state`. The actual state, request results, and event log of a running page. Reads the developer's open browser tab when connected (ask them to interact, then inspect), else runs the page headless.",
    '2. **Evaluate operators**: `POST /lowdefy-docs/eval-operator` `{pageId, expression}` — or `lowdefy_eval_operator`. A REPL for config: run any operator expression against live page state.',
    '3. **Run a request**: `lowdefy_run_request`. Verify the data shape a request returns. The page is rebuilt first when it changed since its last build. Read-only types always run; writes need `cli.agentTools.allowWriteRequests: true` in lowdefy.yaml. A response over 40,000 characters is written in full to `responseFile` under `.lowdefy/responses/`; add `saveResponse: true` to always write it there.',
    '4. **Run an endpoint**: `lowdefy_run_endpoint`. Run an Api routine headlessly and see what it returns, rejects or throws — a `:reject` comes back as `status: "reject"` with the routine\'s own error, not as a failure. Always needs `cli.agentTools.allowWriteRequests: true` (routines are not classified read-only). Add `system: true` to run a scheduled or detached-only `InternalApi` routine as a system context (no `_user`, auth not checked), the way cron does — not combinable with `user`.',
    '5. **Understand the app**: `lowdefy_app_map`. Every page, menu, connection, endpoint, agent, and websocket in one call.',
    '6. **Restart the server**: `POST /lowdefy-docs/restart` `{reason}` — or `lowdefy_restart` (through `lowdefy mcp`: `lowdefy_dev_start` with `restart: true`, a full process restart when the hub runs the server). Only when the server seems stuck or build-status looks stale, or after secrets a wrapper (for example infisical) injects have changed. Answers before the restart lands: then call `GET /lowdefy-docs/build-status?wait=true`, which answers once the restarted server is ready. `.env` edits and local plugin code need no restart: `.env` is watched and restarts the server, and a local plugin change rebuilds, restarting the server when the plugin has server-side types.',
    '',
    '## Routes',
    '',
    '| Route | Purpose |',
    '| --- | --- |',
    '| `GET /lowdefy-docs` | This overview |',
    '| `GET /lowdefy-docs/build-status` | Current build errors/warnings, failing pages + recent browser errors |',
    '| `GET /lowdefy-docs/events` | SSE push channel: `restart` on connect, then `build`, `client_error`, `server_error` events as they happen (build events carry `stale`) |',
    '| `GET /lowdefy-docs/page-config/{pageId}` | Fully built page config, or its build errors |',
    '| `POST /lowdefy-docs/journey` | Drive a page headless through declarative steps (click, fill, select, press, back, goto, email, as, wait, screenshot, expect) and assert state, visibility, text, url or title; screenshots returned as base64 |',
    '| `POST /lowdefy-docs/mutants` | Config mutants on what journeys exercised `{pages, requests, endpoints, appEvents, operators}`: each with a stable `id`, its anchor and source line (for `lowdefy journeys harden`) |',
    '| `GET /lowdefy-docs/find/{id}?pageId=` | Locate where a page/block/request id is defined |',
    '| `POST /lowdefy-docs/eval-operator` | Evaluate an operator expression against live page state |',
    '| `POST /lowdefy-docs/restart` | Restart the dev server process (answers before the restart lands; then `build-status?wait=true` answers once it is back) |',
    '| `ALL /lowdefy-docs/mcp` | MCP endpoint (streamable HTTP) exposing every dev tool |',
  ];
  return lines.join('\n');
}

export default getOverview;
