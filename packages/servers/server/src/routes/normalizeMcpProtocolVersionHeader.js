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

// Claude Code merges the protocol version it negotiated (mcp-protocol-version)
// with a static MCP-Protocol-Version it sets on every request, and the Fetch
// Headers constructor folds the two spellings of one header into a single
// comma-joined value: "2025-11-25, 2025-11-25". @hono/mcp compares that raw
// string against its supported list, so a client that agrees with the server
// twice over is answered 404 "Unsupported protocol version" - which Claude Code
// shows as "MCP endpoint not found". Collapsing a repeated value to the one
// version it names is lossless; a header naming two DIFFERENT versions is left
// for the transport to refuse. Runs before the transport reads the header: the
// transport reads c.req.header(), which reads the raw request headers live.
function normalizeMcpProtocolVersionHeader({ request }) {
  const value = request.headers.get('mcp-protocol-version');
  if (value === null || !value.includes(',')) {
    return;
  }
  const versions = [
    ...new Set(
      value
        .split(',')
        .map((version) => version.trim())
        .filter(Boolean)
    ),
  ];
  if (versions.length !== 1) {
    return;
  }
  request.headers.set('mcp-protocol-version', versions[0]);
}

export default normalizeMcpProtocolVersionHeader;
