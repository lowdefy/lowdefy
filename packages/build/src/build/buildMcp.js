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
import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import lowdefySchema from '../lowdefySchema.js';

// Strict subtree validation - the root testSchema pass only warns, but a bad
// mcp block (legacy string entries, an unknown scope) must stop the build:
// scope is a security boundary the runtime enforces, not a hint.
function validateSchema({ mcp, configKey }) {
  const { valid, errors } = validate({
    schema: lowdefySchema.definitions.mcp,
    data: mcp,
    returnErrors: true,
  });

  if (!valid) {
    // Only the first collected error is reported - one schema fault often
    // cascades into many ajv errors, and the first is the actionable one.
    const error = errors[0];
    const instancePath = error.instancePath.split('/').filter(Boolean);
    let errorConfigKey = configKey;
    let currentData = mcp;

    for (const part of instancePath) {
      if (type.isArray(currentData)) {
        const index = parseInt(part, 10);
        currentData = currentData[index];
      } else {
        currentData = currentData?.[part];
      }
      if (currentData?.['~k']) {
        errorConfigKey = currentData['~k'];
      }
    }

    // Custom errorMessage strings in the schema are already complete
    // sentences - only raw ajv fallback messages need the MCP prefix.
    const message = error.keyword === 'errorMessage' ? error.message : `MCP ${error.message}.`;
    throw new ConfigError(message, { configKey: errorConfigKey });
  }
}

// Validates the mcp block and writes its defaults. Endpoints are matched via
// the same dual id/endpointId match buildApi uses. Referenced endpoints must
// carry the metadata an MCP client needs: a description and a payloadSchema
// (the tool inputSchema).
function buildMcp({ components, context }) {
  if (type.isNone(components.mcp)) {
    components.mcp = {};
  }
  const mcp = components.mcp;
  const configKey = mcp['~k'] ?? components['~k'];

  // Agent tools were removed from mcp; the schema's additionalProperties
  // error would flag the key, but a leftover "agents" block deserves the
  // removal notice, not a generic unknown-property message.
  if (!type.isNone(mcp.agents)) {
    throw new ConfigError(
      'MCP agent tools are not supported. Remove "mcp.agents" from your config.',
      { configKey }
    );
  }

  validateSchema({ mcp, configKey });

  mcp.name = mcp.name ?? 'lowdefy';
  mcp.version = mcp.version ?? '1.0.0';
  mcp.endpoints = mcp.endpoints ?? [];
  mcp.configured = mcp.endpoints.length > 0;

  // Runs after buildAuth, so every referenced endpoint carries its resolved
  // auth decision. A protected or role-gated tool needs the app's own OAuth
  // authorization server to issue the bearer tokens MCP clients present.
  const oauthProviderConfigured = !type.isNone(components.auth?.oauthProvider);
  let hasPublicTool = false;
  const seen = new Set();

  mcp.endpoints.forEach((tool) => {
    const toolConfigKey = tool['~k'] ?? configKey;
    if (seen.has(tool.id)) {
      collectExceptions(
        context,
        new ConfigError(`Duplicate MCP tool "${tool.id}".`, { configKey: toolConfigKey })
      );
      return;
    }
    seen.add(tool.id);
    const endpoint = (components.api ?? []).find(
      (e) => e.id === tool.id || e.endpointId === tool.id
    );
    if (type.isNone(endpoint)) {
      collectExceptions(
        context,
        new ConfigError(`MCP endpoint "${tool.id}" does not reference a defined api endpoint.`, {
          configKey: toolConfigKey,
        })
      );
      return;
    }
    // MCP is an external transport - InternalApi endpoints are not addressable
    // from outside the server, matching the HTTP endpoint route.
    if (endpoint.type === 'InternalApi') {
      collectExceptions(
        context,
        new ConfigError(
          `MCP endpoint "${tool.id}" is an InternalApi endpoint. Only "Api" endpoints can be exposed as MCP tools.`,
          { configKey: toolConfigKey }
        )
      );
      return;
    }
    if (type.isNone(endpoint.description)) {
      collectExceptions(
        context,
        new ConfigError(
          `Endpoint "${tool.id}" is exposed as an MCP tool but does not have a "description".`,
          { configKey: endpoint['~k'] ?? configKey }
        )
      );
      return;
    }
    if (type.isNone(endpoint.payloadSchema)) {
      collectExceptions(
        context,
        new ConfigError(
          `Endpoint "${tool.id}" is exposed as an MCP tool but does not have a "payloadSchema".`,
          { configKey: endpoint['~k'] ?? configKey }
        )
      );
      return;
    }
    if (endpoint.auth?.public === true) {
      hasPublicTool = true;
      return;
    }
    if (!oauthProviderConfigured) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP endpoint "${tool.id}" is protected or role-gated, but "auth.oauthProvider" is not configured. Protected MCP tools require the app's OAuth authorization server, or make the endpoint public.`,
          { configKey: toolConfigKey }
        )
      );
    }
  });

  mcp.hasPublicTool = hasPublicTool;

  return components;
}

export default buildMcp;
