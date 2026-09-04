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

import collectRoutineSteps from '../../../build/buildApi/collectRoutineSteps.js';

// The two places a query against a declared collection is authored: page
// requests (flattened onto page.requests by buildPages) and request steps in
// an endpoint routine. Same definition of a "site" the tenant rules use, but
// keyed on the collection binding rather than the tenant wall, because a
// collection is indexed whether or not it is walled.
function toSite({ location, config, connectionCollections }) {
  const binding = connectionCollections.get(config.connectionId);
  if (type.isUndefined(binding)) return undefined;
  return {
    location,
    collection: binding.collection,
    connectionId: config.connectionId,
    requestType: config.type,
    properties: config.properties ?? {},
    configKey: config['~k'],
  };
}

function collectQuerySites({ components, connectionCollections }) {
  const sites = [];
  const push = (site) => {
    if (!type.isUndefined(site)) sites.push(site);
  };
  (components.pages ?? []).forEach((page) => {
    (page.requests ?? []).forEach((request) => {
      push(
        toSite({
          location: `request "${request.requestId}" on page "${page.pageId}"`,
          config: request,
          connectionCollections,
        })
      );
    });
  });
  (components.api ?? []).forEach((endpoint) => {
    collectRoutineSteps(endpoint.routine).forEach((step) => {
      if (type.isNone(step.connectionId)) return;
      push(
        toSite({
          location: `step "${step.stepId}" on endpoint "${endpoint.endpointId}"`,
          config: step,
          connectionCollections,
        })
      );
    });
  });
  return sites;
}

export default collectQuerySites;
