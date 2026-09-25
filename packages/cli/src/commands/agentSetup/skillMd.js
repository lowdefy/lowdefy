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

function skillMd({ appPath }) {
  return `---
name: lowdefy-config
description: Use when writing or editing Lowdefy YAML config — pages, blocks, operators, actions, connections, or requests. Looks up exact type names, schemas, and examples from the running dev server instead of guessing.
---

# Writing Lowdefy config

${devServerRules({ appPath })}

Never guess type names or properties. Before writing config:

1. Call \`lowdefy_list_types\` to find the exact type name — this includes this project's local plugins.
2. Call \`lowdefy_get_schema\` for the exact properties and events of that type.
3. Call \`lowdefy_get_examples\` to see real usage YAML for blocks.
4. For concepts (state, operators, events, requests), call \`lowdefy_get_doc\` or \`lowdefy_search_docs\`.

## Icons and interactive HTML

- Icons: call \`lowdefy_search_icons\` — never guess a name. Use icons, never emoji. Prefer semantic names (\`icon: edit\`,
  \`delete\`, \`warning\`); add app-specific ones under \`theme.icons.aliases\` in lowdefy.yaml.
- In any HTML string (Html, ClickableHtml, DangerousHtml, and html properties like Tooltip titles)
  write \`<i data-icon="edit"></i>\` — never paste inline SVG. Add \`data-tooltip="Text"\` for hover
  help and \`data-popover="id"\` with a hidden \`data-popover-content="id"\` element for a popover.
- For clicks inside HTML use ClickableHtml: \`data-event="onEdit"\` fires that block event, with the
  element's other \`data-*\` attributes as the event object.
- Links in HTML: \`<a data-page-id="contacts" data-url-query="_id=42">\` — never a hard-coded
  \`href="/contacts?..."\` (it reloads the app and ignores basePath). \`data-new-tab\` instead of
  \`target="_blank"\` (sanitising strips \`target\`).
- Statuses in HTML: \`<span data-tag="success">Approved</span>\` or \`<span data-status="warning">…</span>\`
  — never inline-styled pills or hex status colours. See the \`concepts/html-attributes\` doc.

## Visual feedback

Developers can press \`Cmd/Ctrl+/\` in the running app to point at, draw on, and comment on
what's on screen; the annotation helper copies an agent-readable feedback block to their
clipboard, which they paste to you. Pasted blocks start with "Feedback:" and include the
config file and line each annotation refers to — treat them as precise UI feedback and use
\`lowdefy_inspect_state\` for the page's live state.
`;
}

export default skillMd;
