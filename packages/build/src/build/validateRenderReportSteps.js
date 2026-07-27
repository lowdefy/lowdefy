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
import { ConfigWarning } from '@lowdefy/errors';

import countOperators from '../utils/countOperators.js';
import createCounter from '../utils/createCounter.js';

function collectRenderReportSteps(routine, steps) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectRenderReportSteps(item, steps));
    return;
  }
  if (type.isObject(routine)) {
    if (routine.type === 'RenderReport') {
      steps.push(routine);
    }
    // Recurse into all values (handles control structures like :then, :else, :try, :catch)
    Object.values(routine).forEach((value) => collectRenderReportSteps(value, steps));
  }
}

// Count the page's operators the same way the import build does, and report
// whether _user appears anywhere on it.
function pageUsesUserOperator(page) {
  const counter = createCounter();
  countOperators(page, { counter });
  return counter.getCount('_user') > 0;
}

// Runs after buildApi (needs step stepIds). A scheduled endpoint runs as a system
// context with no user, so a page that evaluates _user throws at render time. Warn
// at build when the combination is statically visible: the endpoint declares
// schedules, the RenderReport step names a page literally, and that page uses
// _user. Operator-computed pageIds fall through to the runtime error.
function validateRenderReportSteps({ components, context }) {
  const scheduledEndpoints = (components.api ?? []).filter(
    (endpoint) => type.isArray(endpoint.schedules) && endpoint.schedules.length > 0
  );
  if (scheduledEndpoints.length === 0) return components;

  const userPages = new Set(
    (components.pages ?? [])
      .filter((page) => pageUsesUserOperator(page))
      .map((page) => page.pageId ?? page.id)
  );

  scheduledEndpoints.forEach((endpoint) => {
    const steps = [];
    collectRenderReportSteps(endpoint.routine, steps);

    steps.forEach((step) => {
      const pageId = step.properties?.pageId;
      if (!type.isString(pageId)) return;
      if (!userPages.has(pageId)) return;

      context.handleWarning(
        new ConfigWarning(
          `RenderReport step "${step.stepId}" at scheduled endpoint "${endpoint.endpointId}" renders page "${pageId}" which uses _user. Scheduled runs have no user, so the render will fail — pass explicit parameters via the schedule payload instead.`,
          { configKey: step['~k'] }
        )
      );
    });
  });
  return components;
}

export default validateRenderReportSteps;
