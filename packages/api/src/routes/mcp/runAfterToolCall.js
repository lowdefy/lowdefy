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

import invokeEndpoint from '../endpoints/invokeEndpoint.js';

// Runs the app's mcp.afterToolCall endpoint as the tool's caller, after the
// reply to the agent is built. The hook observes the call; it can never change
// the reply, so every failure (a refused caller, a payload its schema rejects,
// a routine that errors or rejects) ends as one warning and nothing else.
// Awaited by the caller rather than left running: a serverless platform may
// reap the invocation once the response is sent.
async function runAfterToolCall(context, { hookId, payload }) {
  const { logger } = context;
  try {
    const result = await invokeEndpoint(context, {
      endpointId: hookId,
      payload,
      endpointDepth: 0,
    });
    if (['error', 'reject'].includes(result.status)) {
      logger.warn(
        {
          event: 'warn_mcp_after_tool_call',
          hook: hookId,
          tool: payload.tool,
          status: result.status,
        },
        `MCP afterToolCall hook "${hookId}" failed after tool "${payload.tool}": ${result.error?.message}`
      );
    }
  } catch (error) {
    logger.warn(
      { event: 'warn_mcp_after_tool_call', hook: hookId, tool: payload.tool, err: error },
      `MCP afterToolCall hook "${hookId}" failed after tool "${payload.tool}": ${error.message}`
    );
  }
}

export default runAfterToolCall;
