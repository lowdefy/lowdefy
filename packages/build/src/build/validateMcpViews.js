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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import findMissingPathParams from './buildRoutes/findMissingPathParams.js';

// The view checks that need the app's pages: a view names a page that exists
// and gives every placeholder of its path a value. Reads the route table, which
// holds every page in the full build and in the dev skeleton build, where pages
// with a source file are not built.
function validateMcpViews({ components, context }) {
  // buildMcp stopped on an invalid mcp block and reported it.
  if (type.isNone(context.mcpViewConfig)) {
    return components;
  }
  const mcp = components.mcp;
  const configKey = mcp['~k'] ?? components['~k'];
  const routes = new Map((context.routes ?? []).map((route) => [route.pageId, route]));

  mcp.endpoints.forEach((tool) => {
    const view = tool.view;
    if (type.isNone(view)) {
      return;
    }
    const viewConfigKey = view['~k'] ?? tool['~k'] ?? configKey;
    const route = routes.get(view.pageId);
    if (type.isNone(route)) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP endpoint "${tool.id}" view references page "${view.pageId}", which does not exist.`,
          { configKey: viewConfigKey }
        )
      );
      return;
    }
    const missing = findMissingPathParams({ route, pathParams: view.pathParams });
    if (missing.length > 0) {
      collectExceptions(
        context,
        new ConfigError(
          `MCP endpoint "${tool.id}" view shows page "${view.pageId}" without path params ${missing
            .map((name) => `"${name}"`)
            .join(', ')}. The page's path is "${route.path}".`,
          { configKey: viewConfigKey }
        )
      );
    }
  });

  const { viewPages } = context.mcpViewConfig;
  viewPages.forEach((pageId) => {
    if (!routes.has(pageId)) {
      collectExceptions(
        context,
        new ConfigError(`MCP "viewPages" entry "${pageId}" does not reference a page.`, {
          configKey: viewPages['~k'] ?? configKey,
        })
      );
    }
  });

  return components;
}

export default validateMcpViews;
