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

/* eslint-disable no-param-reassign */

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Validates the mcp block and writes its defaults. Endpoints are matched via
// the same dual id/endpointId match buildApi uses. Referenced endpoints must
// carry the metadata an MCP client needs: a description and a payloadSchema
// (the tool inputSchema).
function buildMcp({ components }) {
  if (type.isNone(components.mcp)) {
    components.mcp = {};
  }
  const mcp = components.mcp;
  const configKey = mcp['~k'] ?? components['~k'];

  mcp.name = mcp.name ?? 'lowdefy';
  mcp.version = mcp.version ?? '1.0.0';
  mcp.endpoints = mcp.endpoints ?? [];
  mcp.configured = mcp.endpoints.length > 0;

  const seen = new Set();

  mcp.endpoints.forEach((endpointId) => {
    if (seen.has(endpointId)) {
      throw new ConfigError(`Duplicate MCP tool "${endpointId}".`, { configKey });
    }
    seen.add(endpointId);
    const endpoint = (components.api ?? []).find(
      (e) => e.id === endpointId || e.endpointId === endpointId
    );
    if (type.isNone(endpoint)) {
      throw new ConfigError(
        `MCP endpoint "${endpointId}" does not reference a defined api endpoint.`,
        { configKey }
      );
    }
    // MCP is an external transport - InternalApi endpoints are not addressable
    // from outside the server, matching the HTTP endpoint route.
    if (endpoint.type === 'InternalApi') {
      throw new ConfigError(
        `MCP endpoint "${endpointId}" is an InternalApi endpoint. Only "Api" endpoints can be exposed as MCP tools.`,
        { configKey }
      );
    }
    if (type.isNone(endpoint.description)) {
      throw new ConfigError(
        `Endpoint "${endpointId}" is exposed as an MCP tool but does not have a "description".`,
        { configKey: endpoint['~k'] ?? configKey }
      );
    }
    if (type.isNone(endpoint.payloadSchema)) {
      throw new ConfigError(
        `Endpoint "${endpointId}" is exposed as an MCP tool but does not have a "payloadSchema".`,
        { configKey: endpoint['~k'] ?? configKey }
      );
    }
  });

  return components;
}

export default buildMcp;
