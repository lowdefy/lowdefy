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

import { buildPagePath, cleanBuildArtifact, mcpViewOperators, urlQuery } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// The address of the page a view tool's call shows: the page's path and query,
// starting with "/", with no origin and no basePath. pathParams and urlQuery
// are evaluated after the routine, with _payload as the arguments the tool was
// called with and _response as what the routine returned. The path is the
// page's pattern in routes.json filled by buildPagePath, the one URL builder.
//
// The address is sent to the MCP client, so a view is evaluated with the view
// operators alone (mcpViewOperators) and with no secrets and no user: whatever
// its config holds, it can read nothing but the call. The build refuses any
// other operator there.
//
// Returns { path }, or { refusal } when a path value is missing, "." or "..":
// that is the call's own outcome, and its message names only the placeholder.
// Throws the operator's error when one fails.
async function resolveViewAddress(context, { payload, response, view }) {
  const operators = Object.fromEntries(
    mcpViewOperators
      .filter((name) => name in context.operators)
      .map((name) => [name, context.operators[name]])
  );
  const evaluateOperators = createEvaluateOperators({
    ...context,
    operators,
    organization: null,
    secrets: {},
    user: null,
  });
  const evaluated = cleanBuildArtifact(
    evaluateOperators({
      input: { pathParams: view.pathParams ?? {}, urlQuery: view.urlQuery ?? {} },
      location: 'mcp.view',
      payload,
      response,
    })
  );
  const routes = await context.readConfigFile('routes.json');
  const route = routes.find((candidate) => candidate.pageId === view.pageId);
  let pagePath;
  try {
    pagePath = buildPagePath({
      pageId: view.pageId,
      path: route?.path,
      pathParams: evaluated.pathParams,
    });
  } catch (error) {
    return { refusal: error.message };
  }
  const query = urlQuery.stringify(evaluated.urlQuery);
  if (query === '') {
    return { path: `/${pagePath}` };
  }
  return { path: `/${pagePath}?${query}` };
}

export default resolveViewAddress;
