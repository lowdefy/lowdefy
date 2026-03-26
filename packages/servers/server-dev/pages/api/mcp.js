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

import { callEndpoint, verifyJwt } from '@lowdefy/api';

import apiWrapper from '../../../lib/server/apiWrapper.js';

async function handler({ context, req, res }) {
  // DELETE: session cleanup (MCP protocol requirement)
  if (req.method === 'DELETE') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'POST') {
    throw new Error('Only POST and DELETE requests are supported.');
  }

  // Load MCP config
  const mcpConfig = await context.readConfigFile('mcp.json');
  if (!mcpConfig) {
    res.status(404).json({ error: 'MCP not configured' });
    return;
  }

  // Authenticate via JWT (optional — only when auth.jwt is configured)
  let user = null;
  const authConfig = await context.readConfigFile('auth.json');
  if (authConfig?.config?.jwt?.secret) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        user = await verifyJwt(token, authConfig.config.jwt);
      } catch {
        // Invalid token — continue with null user (filtered tool list)
      }
    }
  }
  context.user = user;

  const { method, params, id } = req.body;

  context.logger.info({ color: 'gray' }, `MCP: ${method}`);

  if (method === 'initialize') {
    return jsonRpc(res, id, {
      protocolVersion: '2025-03-26',
      serverInfo: {
        name: mcpConfig.name ?? 'lowdefy',
        version: mcpConfig.version ?? '1.0.0',
      },
      capabilities: { tools: {} },
    });
  }

  if (method === 'tools/list') {
    const tools = [];
    for (const endpointId of mcpConfig.tools ?? []) {
      const ep = await context.readConfigFile(`api/${endpointId}.json`);
      if (!ep) continue;

      // Check endpoint auth — filter by user access
      if (!ep.auth?.public) {
        if (!user) continue;
        if (ep.auth?.roles) {
          const userRoles = user.roles ?? [];
          if (!ep.auth.roles.some((r) => userRoles.includes(r))) continue;
        }
      }

      tools.push({
        name: ep.endpointId,
        description: ep.description ?? '',
        inputSchema: ep.payloadSchema ?? { type: 'object' },
      });
    }
    return jsonRpc(res, id, { tools });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params ?? {};

    // Verify endpoint is in mcp.tools list
    if (!(mcpConfig.tools ?? []).includes(name)) {
      return jsonRpcError(res, id, -32602, 'Unknown tool');
    }

    try {
      const result = await callEndpoint(context, {
        endpointId: name,
        payload: args ?? {},
        pageId: '_mcp',
        blockId: '_mcp',
      });

      return jsonRpc(res, id, {
        content: [{ type: 'text', text: JSON.stringify(result.response) }],
      });
    } catch (error) {
      context.logger.error(error);
      return jsonRpcError(res, id, -32603, error.message ?? 'Tool execution failed');
    }
  }

  return jsonRpcError(res, id, -32601, 'Method not found');
}

function jsonRpc(res, id, result) {
  res.status(200).json({ jsonrpc: '2.0', id, result });
}

function jsonRpcError(res, id, code, message) {
  res.status(200).json({ jsonrpc: '2.0', id, error: { code, message } });
}

export default apiWrapper(handler);
