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

import modelNames from './modelNames.js';

// Member tokens for MCP scripts live in the auth database as their own model,
// so the adapter reads and writes them like every other auth row and the MCP
// route's lookup is one more indexed read beside consents, users and members.
// The plugin declares the schema only - no endpoints: tokens are created and
// revoked by the auth steps, never over BetterAuth's HTTP surface. The token
// itself is never stored, only its SHA-256 (hash) and its first characters
// (start) so people can tell tokens apart.
function buildMcpTokenPlugin() {
  return {
    id: 'lowdefy-mcp-token',
    schema: {
      mcpToken: {
        modelName: modelNames.mcpToken,
        fields: {
          organizationId: { type: 'string', required: true, index: true },
          userId: { type: 'string', required: true, index: true },
          // The member row the token was made for. The route accepts the token
          // only while that row stands, so leaving, removal or deletion ends
          // it by any path, and a rejoined member's new row holds no old tokens.
          memberId: { type: 'string', required: true },
          name: { type: 'string', required: true },
          hash: { type: 'string', required: true, unique: true },
          start: { type: 'string', required: true },
          createdAt: { type: 'date', required: true },
          expiresAt: { type: 'date', required: false },
          lastUsedAt: { type: 'date', required: false },
        },
      },
    },
  };
}

export default buildMcpTokenPlugin;
