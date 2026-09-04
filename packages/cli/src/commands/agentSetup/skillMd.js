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

function skillMd({ port, appPath, version }) {
  const appPathLine =
    appPath === ''
      ? ''
      : `\nThe Lowdefy app config (lowdefy.yaml, pages, requests) lives in \`${appPath}/\`.\n`;
  return `---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
kind: reference
lowdefyVersion: ${version}
---

# Writing Lowdefy config

The dev server serves docs for everything installed in this project at
\`http://localhost:${port}/lowdefy-docs\` (also as MCP tools via the \`lowdefy-docs\` server).
${appPathLine}
Never guess type names or properties. Before writing config:

1. Call \`lowdefy_list_types\` (or \`GET /lowdefy-docs/blocks\`, \`/lowdefy-docs/operators\`,
   \`/lowdefy-docs/actions\`, \`/lowdefy-docs/connections\`, \`/lowdefy-docs/requests\`) to find the exact
   type name — this includes this project's local plugins.
2. Call \`lowdefy_get_schema\` (or \`GET /lowdefy-docs/schema/{kind}/{type}\`) for the
   exact properties and events of that type.
3. Call \`lowdefy_get_examples\` (or \`GET /lowdefy-docs/examples/{type}\`) to see real
   usage YAML for blocks.
4. For concepts (state, operators, events, requests), call \`lowdefy_get_doc\`
   or \`lowdefy_search_docs\`.

## Done means

An edit is finished only when all four hold:

1. \`lowdefy check\` is green — no errors and no new warnings (\`lowdefy_check\`, or run the CLI).
2. \`GET /lowdefy-docs/build-status\` is clean: no build errors or warnings, and no server or
   browser errors from your change. The post-edit hook reports this to you automatically after
   every config edit, if this project installed it.
3. The journeys covering the pages you touched pass (\`run_journey\`, or
   \`lowdefy test --filter "<journey name>"\`).
4. Snapshot drift is reviewed, not blind-accepted: \`lowdefy snapshot --check\`, and a snapshot is
   only updated when the diff is the change you intended.

Nothing else counts as done — not "the YAML looks right", not "the page rendered once".

## Visual feedback

Developers can press \`Cmd/Ctrl+/\` in the running app to point at, draw on, and comment on
what's on screen; the annotation helper copies an agent-readable feedback block to their
clipboard, which they paste to you. Pasted blocks start with "Feedback:" and include the
config file and line each annotation refers to — treat them as precise UI feedback and use
\`lowdefy_inspect_state\` for the page's live state.
`;
}

export default skillMd;
