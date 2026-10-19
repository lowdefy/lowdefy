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

import collectExceptions from '../../utils/collectExceptions.js';
import checkRouteTies from './checkRouteTies.js';
import parsePageRoute from './parsePageRoute.js';
import validateFrameworkPagePaths from './validateFrameworkPagePaths.js';

// The route table the server matches URLs against: every page's pattern,
// checked for ties, kept on the context like the other build-time id tables
// so the final addKeys pass does not key it. Runs once the page list is complete (after
// addDefaultPages), before buildAuth.
function buildRoutes({ components, context }) {
  const routes = [];
  for (const page of components.pages ?? []) {
    // buildPage refuses a page without a string id.
    if (!type.isString(page.id)) {
      continue;
    }
    try {
      routes.push(parsePageRoute({ page }));
    } catch (error) {
      collectExceptions(context, error);
    }
  }
  validateFrameworkPagePaths({ components, routes, context });
  checkRouteTies({ routes, context });
  context.routes = routes;
  return components;
}

export default buildRoutes;
