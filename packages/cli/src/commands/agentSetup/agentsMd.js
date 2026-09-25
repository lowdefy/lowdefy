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

import devServerRules from './devServerRules.js';

function agentsMd({ devCommand, appPath }) {
  const appDescription =
    appPath === ''
      ? 'This project is a [Lowdefy](https://lowdefy.com) app'
      : `This project contains a [Lowdefy](https://lowdefy.com) app in \`${appPath}/\``;
  return `## Lowdefy

${appDescription}: a web app defined in YAML config files
rather than hand-written code. Pages compose **blocks** (UI components), **operators** (logic
like \`_if\`, \`_get\`, \`_state\`), **actions** (event handlers), and **connections/requests**
(databases and APIs).

### The dev server

${devServerRules({ appPath })}

Developers start it themselves with \`${devCommand}\`; agents use the tools above.

### Looking up types, schemas, and docs

The dev server serves documentation for every block, operator, action, connection, and request type
installed in this project (including local plugins).

**Never guess type names or properties.** Before writing or editing Lowdefy config:

1. List available types: call \`lowdefy_list_types\` — this includes this project's local plugins.
2. Get the exact schema: call \`lowdefy_get_schema\`.
3. See real usage: call \`lowdefy_get_examples\`.
4. Read concept docs or search: call \`lowdefy_get_doc\` or \`lowdefy_search_docs\`.

### Icons and interactive HTML

- Icons: call \`lowdefy_search_icons\` — never guess a name. Use icons, never emoji. Prefer semantic names (\`icon: edit\`,
  \`delete\`, \`warning\`); add app-specific ones under \`theme.icons.aliases\` in lowdefy.yaml.
- In any HTML string (Html, ClickableHtml, DangerousHtml, and html properties like Tooltip titles)
  write \`<i data-icon="edit"></i>\` — never paste inline SVG. Add \`data-tooltip="Text"\` for hover
  help and \`data-popover="id"\` with a hidden \`data-popover-content="id"\` element for a popover.
- For clicks inside HTML use ClickableHtml: \`data-event="onEdit"\` fires that block event, with the
  element's other \`data-*\` attributes as the event object.

### Visual feedback

While the dev server is running, developers can press \`Cmd/Ctrl+/\` in the browser to point at,
draw on, and comment on the running app; the annotation helper copies an agent-readable feedback
block to their clipboard, which they paste into the agent session. Pasted blocks start with
"Feedback:" and include the config file and line each annotation refers to — treat them as
precise UI feedback.
`;
}

export default agentsMd;
