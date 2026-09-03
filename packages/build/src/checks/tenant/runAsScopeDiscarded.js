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
import { ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectRoutineSteps from '../../build/buildApi/collectRoutineSteps.js';

// An endpoint-level `runAs` scopes every walled step under it to one
// organization. A step declaring `tenant: none` returns before the scope is
// read (api resolveTenant.js), so the endpoint's organization is silently
// discarded for that step and it runs across every organization instead - the
// opposite of what the endpoint declares. validateStep already refuses the
// same pair declared on one step; the endpoint-level pair is a warning because
// mixing a scoped endpoint with one deliberately unscoped step is a legitimate
// (if rare) shape.
function run({ components, context }) {
  (components.api ?? []).forEach((endpoint) => {
    if (type.isNone(endpoint.runAs)) return;
    collectRoutineSteps(endpoint.routine).forEach((step) => {
      if (step.tenant !== 'none') return;
      if (!context.tenantConnections?.has(step.connectionId)) return;
      context.handleWarning(
        new ConfigWarning(
          `Step "${step.stepId}" at endpoint "${endpoint.endpointId}" declares "tenant: none" under an endpoint "runAs". The step opts out of the wall before the endpoint's organization is read, so that scope is discarded and the step runs across every organization. Remove "tenant: none" to keep the endpoint's scope.`,
          { configKey: step['~k'], checkSlug: 'tenant-unscoped' }
        )
      );
    });
  });
}

const runAsScopeDiscarded = {
  slug: 'tenant-unscoped',
  checkOnly: false,
  run,
};

export default runAsScopeDiscarded;
