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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

function buildMcp({ components, context }) {
  if (type.isNone(components.mcp)) {
    return components;
  }

  const endpointMap = new Map(
    (components.api ?? []).map((ep) => [ep.endpointId, ep])
  );

  for (const toolId of components.mcp.tools ?? []) {
    const endpoint = endpointMap.get(toolId);

    if (!endpoint) {
      throw new ConfigError(`MCP tool "${toolId}" references non-existent endpoint.`, {
        configKey: components.mcp['~k'],
      });
    }

    if (endpoint.type === 'InternalApi') {
      throw new ConfigError(
        `MCP tool "${toolId}" references InternalApi endpoint. Only Api endpoints can be exposed via MCP.`,
        { configKey: components.mcp['~k'] }
      );
    }

    if (type.isNone(endpoint.description)) {
      context.handleWarning(
        new ConfigWarning(
          `Endpoint "${toolId}" listed in mcp.tools has no description. LLMs use the description for tool selection.`,
          { configKey: endpoint['~k'] }
        )
      );
    }

    if (type.isNone(endpoint.payloadSchema)) {
      context.handleWarning(
        new ConfigWarning(
          `Endpoint "${toolId}" listed in mcp.tools has no payloadSchema. LLMs need the schema to generate tool inputs.`,
          { configKey: endpoint['~k'] }
        )
      );
    }
  }

  return components;
}

export default buildMcp;
