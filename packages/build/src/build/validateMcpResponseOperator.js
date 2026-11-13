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

import { getOperatorType, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';

function collectResponseNodes(value, nodes) {
  if (type.isArray(value)) {
    value.forEach((item) => collectResponseNodes(item, nodes));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  if (getOperatorType(value) === '_response') {
    nodes.add(value);
  }
  Object.keys(value).forEach((key) => collectResponseNodes(value[key], nodes));
}

// _response reads what a tool's routine returned, which exists only while the
// server resolves that tool's view address. Anywhere else it would silently
// read nothing, so the build refuses it. Runs once pages are built, on the
// config nodes the build counted, before the plugin checks clear them.
function validateMcpResponseOperator({ components, context }) {
  // buildMcp stopped on an invalid mcp block and reported it.
  if (type.isNone(context.mcpViewConfig)) {
    return components;
  }
  const viewNodes = new Set();
  components.mcp.endpoints.forEach((tool) => {
    collectResponseNodes(tool.view?.pathParams, viewNodes);
    collectResponseNodes(tool.view?.urlQuery, viewNodes);
  });

  const counters = [
    context.typeCounters.operators.server,
    context.typeCounters.operators.client,
    context.typeCountersMobile.operators.client,
  ];
  const reported = new Set();
  counters.forEach((counter) => {
    counter.getNodes('_response').forEach((node) => {
      if (viewNodes.has(node) || reported.has(node)) {
        return;
      }
      reported.add(node);
      collectExceptions(
        context,
        new ConfigError(
          '_response can only be used in the "pathParams" and "urlQuery" of an MCP endpoint "view".',
          { configKey: node['~k'] ?? counter.getLocation('_response') }
        )
      );
    });
  });

  return components;
}

export default validateMcpResponseOperator;
