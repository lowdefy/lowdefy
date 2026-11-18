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

import { getOperatorType, isViewSourceOrigin, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateMcpViewOperators from './validateMcpViewOperators.js';

// The view config of the mcp block: its defaults and the checks that need no
// built pages. viewPages, viewSources and viewEndpoints move to the context,
// so mcp.json carries only what the server reads: context.mcpViews is the
// "views" of mcp.json, which buildMcpViews fills in and writeMcp attaches. It
// is build output, kept on the context so the final addKeys pass does not key it.
function buildMcpViewConfig({ components, context }) {
  const mcp = components.mcp;
  const configKey = mcp['~k'] ?? components['~k'];
  const viewPages = mcp.viewPages ?? [];
  const viewSources = mcp.viewSources ?? [];
  const viewEndpoints = mcp.viewEndpoints ?? [];
  delete mcp.viewPages;
  delete mcp.viewSources;
  delete mcp.viewEndpoints;

  const viewTools = mcp.endpoints.filter((tool) => !type.isNone(tool.view));
  const endpoints = components.api ?? [];

  viewTools.forEach((tool) => {
    const view = tool.view;
    view.entrypoint = view.entrypoint ?? false;
    validateMcpViewOperators({ configKey, context, tool });
    // _payload and _response stay unevaluated: the server evaluates them after
    // each call, so they are server operators.
    countOperators(view.pathParams ?? {}, { counter: context.typeCounters.operators.server });
    countOperators(view.urlQuery ?? {}, { counter: context.typeCounters.operators.server });

    const endpoint = endpoints.find((e) => e.id === tool.id || e.endpointId === tool.id);
    const required = endpoint?.payloadSchema?.required;
    if (view.entrypoint === true && type.isArray(required) && required.length > 0) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP endpoint "${tool.id}" view is an entry point, but its "payloadSchema" has required properties. An entry point is called with no arguments, so remove "entrypoint" or the required properties.`,
          { configKey: view['~k'] ?? tool['~k'] ?? configKey }
        )
      );
    }
  });

  // A view's origin is computed from the app's public URL, which only
  // auth.oauthProvider pins, and a view signs in with the grant it issues.
  if (
    (viewTools.length > 0 || viewPages.length > 0) &&
    type.isNone(components.auth?.oauthProvider)
  ) {
    collectExceptions(
      context,
      new ConfigError(
        'MCP views require "auth.oauthProvider". Configure the app\'s OAuth authorization server, or remove "view" from the MCP endpoints and "mcp.viewPages".',
        { configKey: viewTools[0]?.view['~k'] ?? viewPages['~k'] ?? configKey }
      )
    );
  }

  const checkDuplicateViewEndpointId = createCheckDuplicateId({
    message: 'Duplicate MCP view endpoint "{{ id }}".',
  });
  viewEndpoints.forEach((viewEndpoint) => {
    const viewEndpointConfigKey = viewEndpoint['~k'] ?? configKey;
    try {
      checkDuplicateViewEndpointId({ id: viewEndpoint.id, configKey: viewEndpointConfigKey });
    } catch (error) {
      collectExceptions(context, error);
      return;
    }
    const endpoint = endpoints.find(
      (e) => e.id === viewEndpoint.id || e.endpointId === viewEndpoint.id
    );
    if (type.isNone(endpoint)) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP view endpoint "${viewEndpoint.id}" does not reference a defined api endpoint.`,
          { configKey: viewEndpointConfigKey }
        )
      );
    }
  });

  viewSources.forEach((source) => {
    if (type.isObject(source) && getOperatorType(source) === null) {
      collectExceptions(
        context,
        new ConfigError(
          'MCP "viewSources" items should be origin strings, or a _build or _secret operator.',
          { received: source, configKey: source['~k'] ?? viewSources['~k'] ?? configKey }
        )
      );
    }
    // The entries become the content security policy of a view, so a literal
    // is checked here. A _secret is checked by the server, once it has a value.
    if (type.isString(source) && !isViewSourceOrigin(source)) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP "viewSources" item "${source}" is not an origin. An item is one https or wss origin with no path, such as "https://files.example.com".`,
          { received: source, configKey: viewSources['~k'] ?? configKey }
        )
      );
    }
  });
  // _build is resolved by now. _secret stays for the server to evaluate at start.
  countOperators(viewSources, { counter: context.typeCounters.operators.server });

  context.mcpViews = {
    configured: viewTools.length > 0,
    pages: {},
    sources: [...viewSources],
  };
  context.mcpViewConfig = { viewPages, viewEndpoints };

  return components;
}

export default buildMcpViewConfig;
