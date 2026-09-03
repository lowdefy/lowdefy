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

// The two places a request on a walled connection is authored: page requests
// (already flattened onto page.requests by buildPages) and request steps in
// an endpoint routine (a tree of arrays, control objects and steps; a step is
// the object carrying the stepId buildStep stamped). Every tenant rule walks
// the same list so the rules agree on what a "site" is and how it is named.
function collectRoutineSteps(routine, steps) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectRoutineSteps(item, steps));
    return;
  }
  if (!type.isObject(routine)) {
    return;
  }
  if (type.isString(routine.stepId)) {
    steps.push(routine);
    return;
  }
  Object.keys(routine).forEach((key) => collectRoutineSteps(routine[key], steps));
}

function toSite({ location, config, tenantConnections }) {
  const connection = tenantConnections.get(config.connectionId);
  return {
    location,
    connectionId: config.connectionId,
    field: connection.field,
    connectionType: connection.type,
    requestType: config.type,
    tenant: config.tenant,
    properties: config.properties ?? {},
    configKey: config['~k'],
  };
}

function collectWalledSites({ components, context }) {
  const tenantConnections = context.tenantConnections ?? new Map();
  if (tenantConnections.size === 0) {
    return [];
  }
  const sites = [];
  (components.pages ?? []).forEach((page) => {
    (page.requests ?? []).forEach((request) => {
      if (!tenantConnections.has(request.connectionId)) return;
      sites.push(
        toSite({
          location: `Request "${request.requestId}" at page "${page.pageId}"`,
          config: request,
          tenantConnections,
        })
      );
    });
  });
  (components.api ?? []).forEach((endpoint) => {
    const steps = [];
    collectRoutineSteps(endpoint.routine, steps);
    steps.forEach((step) => {
      if (!tenantConnections.has(step.connectionId)) return;
      sites.push(
        toSite({
          location: `Step "${step.stepId}" at endpoint "${endpoint.endpointId}"`,
          config: step,
          tenantConnections,
        })
      );
    });
  });
  return sites;
}

export default collectWalledSites;
