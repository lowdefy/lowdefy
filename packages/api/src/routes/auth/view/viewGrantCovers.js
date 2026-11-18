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

// Whether the grant a view session was minted from covers a scope, over the
// closed MCP vocabulary and with the rule the MCP server applies to its tools:
// mcp:write covers a write, and either scope covers a read. A grant holding
// neither scope covers nothing, so its view session reaches nothing.
function viewGrantCovers({ viewSession, scope }) {
  const { grantedScopes } = viewSession;
  if (scope === 'mcp:read') {
    return grantedScopes.includes('mcp:read') || grantedScopes.includes('mcp:write');
  }
  return grantedScopes.includes('mcp:write');
}

export default viewGrantCovers;
