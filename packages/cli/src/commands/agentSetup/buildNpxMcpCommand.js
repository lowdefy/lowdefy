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

// The command that runs `lowdefy mcp` at an exact version through npx.
//
// It must not depend on a checkout's node_modules: a fresh git worktree has
// none until it is installed, and a client starts its MCP servers once, when a
// session opens - a server that fails then leaves the whole session without
// tools. npx keeps each exact version in the shared npm cache, so after the
// first download every checkout and worktree starts it offline in under a
// second. An exact version never goes stale in the cache the way an unversioned
// `npx lowdefy` does, and lowdefy mcp works with dev servers of other versions
// (it takes their tool lists from them), so a pin left behind by an upgrade
// keeps working.
function buildNpxMcpCommand({ version }) {
  return { command: 'npx', args: ['--prefer-offline', '--yes', `lowdefy@${version}`, 'mcp'] };
}

export default buildNpxMcpCommand;
