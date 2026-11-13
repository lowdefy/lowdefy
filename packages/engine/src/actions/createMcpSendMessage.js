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

import { type } from '@lowdefy/helpers';

// lowdefy._internal.mcp is set by a client that runs the page as a view in an MCP host. A page in
// a browser tab or a native shell has none.
function createMcpSendMessage({ context }) {
  return function mcpSendMessage(params) {
    const { mcp } = context._internal.lowdefy._internal;
    if (type.isNone(mcp)) {
      throw new Error(
        'McpSendMessage needs an MCP host, and this page is not shown inside one. Run the action only when "_mcp: embedded" is true.'
      );
    }
    return mcp.sendMessage(params);
  };
}

export default createMcpSendMessage;
