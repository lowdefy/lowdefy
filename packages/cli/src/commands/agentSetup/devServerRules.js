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

// The dev-server rules both AGENTS.md and the skill teach. One text, so the
// two never disagree.
function devServerRules({ appPath }) {
  const appNote =
    appPath === ''
      ? ''
      : `\n- The app lives in \`${appPath}/\`. If the repository holds several apps, pass that app's directory as \`directory\`.`;
  return `Your Lowdefy tools come from the \`lowdefy-docs\` MCP server (\`lowdefy mcp\`, see \`.mcp.json\`). It routes every
\`lowdefy_\` tool to the dev server of the app and git checkout you are working in, and starts that server when needed.

- Never run \`lowdefy dev\` yourself, never choose a port, and never kill processes by port or name. Use
  \`lowdefy_dev_start\` (\`restart: true\` after changing local plugin code or \`.env\`), \`lowdefy_dev_stop\`,
  \`lowdefy_dev_status\` and \`lowdefy_dev_logs\`.
- Working in a different git worktree from the session (for example as a subagent)? Pass your working
  directory as \`directory\` on every \`lowdefy_\` call.${appNote}
- After every config edit, call \`lowdefy_build_status\` with \`wait: true\` and fix what it reports.
- Every result starts with the app and checkout it came from. Check it.`;
}

export default devServerRules;
