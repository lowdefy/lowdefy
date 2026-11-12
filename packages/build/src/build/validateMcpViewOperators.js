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

import { getOperatorType, mcpViewOperators, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';

function collectOperatorNodes(value, nodes) {
  if (type.isArray(value)) {
    value.forEach((item) => collectOperatorNodes(item, nodes));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  const operator = getOperatorType(value);
  if (operator !== null) {
    nodes.push({ node: value, operator });
  }
  Object.keys(value).forEach((key) => collectOperatorNodes(value[key], nodes));
}

// The address a view's pathParams and urlQuery build is sent to the MCP
// client, so they may read the call (_payload, _response) and shape values,
// and nothing else: an operator such as _secret, _user or _js would put what it
// reads into a URL the client receives. The server evaluates a view with the
// same list, so an operator this let through would not run there either.
function validateMcpViewOperators({ configKey, context, tool }) {
  const nodes = [];
  collectOperatorNodes(tool.view.pathParams, nodes);
  collectOperatorNodes(tool.view.urlQuery, nodes);
  nodes.forEach(({ node, operator }) => {
    if (mcpViewOperators.includes(operator)) {
      return;
    }
    collectExceptions(
      context,
      new ConfigError(
        `MCP endpoint "${
          tool.id
        }" view uses the operator "${operator}". The "pathParams" and "urlQuery" of a view can use only ${mcpViewOperators.join(
          ', '
        )}.`,
        { configKey: node['~k'] ?? tool.view['~k'] ?? tool['~k'] ?? configKey }
      )
    );
  });
}

export default validateMcpViewOperators;
