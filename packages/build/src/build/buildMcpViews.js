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

const DEFAULT_SCOPE = 'mcp:write';

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

// What each view page uses, for mcp.json: a view session reaches only the
// endpoints and websocket channels listed here. Runs in the full build once
// pages are built, on the references buildPage collected. The dev skeleton
// build leaves views.pages empty: it builds pages on request, and the dev
// server serves no views.
function buildMcpViews({ components, context }) {
  // buildMcp stopped on an invalid mcp block and reported it.
  if (type.isNone(context.mcpViewConfig)) {
    return components;
  }
  const mcp = components.mcp;
  const { viewPages, viewEndpoints } = context.mcpViewConfig;

  // An endpoint's scope is its tool scope when it is a tool, else its
  // viewEndpoints scope, else mcp:write.
  const scopes = new Map();
  viewEndpoints.forEach((viewEndpoint) => scopes.set(viewEndpoint.id, viewEndpoint.scope));
  mcp.endpoints.forEach((tool) => scopes.set(tool.id, tool.scope));

  const callableEndpointIds = new Set(
    (components.api ?? [])
      .filter((endpoint) => endpoint.type !== 'InternalApi')
      .map((endpoint) => endpoint.endpointId)
  );

  const viewPageIds = [
    ...mcp.endpoints.filter((tool) => !type.isNone(tool.view)).map((tool) => tool.view.pageId),
    ...viewPages,
  ];

  sortedUnique(viewPageIds).forEach((pageId) => {
    const page = (components.pages ?? []).find((item) => item.pageId === pageId);
    // validateMcpViews reports a view that names no page.
    if (type.isNone(page)) {
      return;
    }
    page.view = true;

    // Only a static CallAPI endpointId is collected (buildEvents), with the
    // endpoints a Dynamic block's policy lists. A CallAPI whose endpointId is
    // an operator is not listed, so a view session is refused on that call.
    const endpointIds = (context.callApiActionRefs ?? [])
      .filter((ref) => ref.sourcePageId === pageId)
      .map((ref) => ref.endpointId)
      .filter((endpointId) => callableEndpointIds.has(endpointId));

    const websocketIds = [
      ...(context.websocketActionRefs ?? [])
        .filter((ref) => ref.sourcePageId === pageId)
        .map((ref) => ref.websocketId),
      ...(page.subscriptions ?? []).map((subscription) => subscription.websocketId),
    ].filter((websocketId) => context.websocketIds.has(websocketId));

    context.mcpViews.pages[pageId] = {
      endpoints: sortedUnique(endpointIds).map((id) => ({
        id,
        scope: scopes.get(id) ?? DEFAULT_SCOPE,
      })),
      websockets: sortedUnique(websocketIds),
      // The build collects no page-level agent references, so a view session
      // reaches no agent.
      agents: [],
    };
  });

  return components;
}

export default buildMcpViews;
