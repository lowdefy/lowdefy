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

import { MCP_SERVER_NAME } from './mcpServerNames.js';

// The dev-server rules both AGENTS.md and the skill teach. One text, so the
// two never disagree.
function devServerRules() {
  return `Your Lowdefy tools come from the \`${MCP_SERVER_NAME}\` MCP server (\`lowdefy mcp\`, see \`.mcp.json\`). It routes every
\`lowdefy_\` tool to the dev server of the app and git checkout you are working in, and starts that server when needed.

- Never run \`lowdefy dev\` yourself, never choose a port, and never kill processes by port or name. Use
  \`lowdefy_dev_start\`, \`lowdefy_dev_stop\`, \`lowdefy_dev_status\` and \`lowdefy_dev_logs\`.
- No \`lowdefy_\` tools in your session (the MCP server did not start, or dropped)? Still never run
  \`lowdefy dev\` or the app's dev script. Run \`npx lowdefy hub start <app>\` (\`--restart\` to restart): the hub
  starts the same server the tools would and prints its \`url\`. Stop it with \`npx lowdefy hub stop <app>\`.
  Tell the developer the tools are missing.
- To show the app in a browser or preview pane, open the \`url\` the server reports. Never configure the pane
  to start a server of its own: that is a second dev server for the same app, outside the hub.
- Restart (\`lowdefy_dev_start\` with \`restart: true\`) only when the server seems stuck or build status looks
  stale, or after secrets a wrapper (for example infisical) injects have changed. \`.env\` edits and local
  plugin code are picked up without a restart.
- Working in a different git worktree from the session (for example as a subagent)? Pass your working
  directory as \`directory\` on every \`lowdefy_\` call.
- A Lowdefy app is a folder containing \`lowdefy.yaml\`. \`lowdefy_\` tools pick the app themselves: the app
  folder the session started in, else the repository's only app; otherwise they fail and list the apps. When
  the developer named an app, or a call listed several, pass its folder as \`directory\`.
- Shell commands (\`lowdefy test\`, \`lowdefy journeys …\`) choose the app the same way and pass its folder as
  \`--config-directory <app>\`. Paths in their arguments are relative to where you run them, so start them
  with the app folder (\`<app>/tests/journeys/…\`).
- After every config edit, call \`lowdefy_build_status\` with \`wait: true\` and fix what it reports.
- When you finish work in a git worktree you created for the task, call \`lowdefy_dev_stop\` with that
  \`directory\` before you report back. Do not stop a server in a checkout you share with another agent. A server
  left running stops once it has been idle for 15 minutes.
- Every result starts with the app and checkout it came from. Check it.`;
}

export default devServerRules;
