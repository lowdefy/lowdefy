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

import { ConfigError } from '@lowdefy/errors';
import { buildPagePath, cleanBuildArtifact, urlQuery } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// The address of the page a view tool's call shows: the page's path and query,
// starting with "/", with no origin and no basePath. pathParams and urlQuery
// are evaluated after the routine, with _payload as the arguments the tool was
// called with and _response as what the routine returned. The path is the
// page's pattern in routes.json filled by buildPagePath, the one URL builder.
// Throws the operator's error when one fails, and a ConfigError when a path
// value is missing, "." or "..".
async function resolveViewAddress(context, { payload, response, view }) {
  const evaluateOperators = createEvaluateOperators(context);
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
    throw new ConfigError(error.message, { cause: error });
  }
  const query = urlQuery.stringify(evaluated.urlQuery);
  if (query === '') {
    return `/${pagePath}`;
  }
  return `/${pagePath}?${query}`;
}

export default resolveViewAddress;
