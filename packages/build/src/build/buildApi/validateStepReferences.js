/*
  Copyright 2020-2024 Lowdefy, Inc

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
import extractOperatorKey from '../../utils/extractOperatorKey.js';
import traverseConfig from '../../utils/traverseConfig.js';

// Collect all step IDs from a routine (including nested control structures)
// Note: After buildRoutine, steps have requestId (original id) and id is modified
function collectStepIds(routine, stepIds) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectStepIds(item, stepIds));
    return;
  }
  if (type.isObject(routine)) {
    // Check if this is a step (has requestId after build, or id before build)
    if (routine.requestId) {
      stepIds.add(routine.requestId);
    }
    // Recurse into all values (handles control structures like :then, :else, :try, :catch)
    Object.values(routine).forEach((value) => collectStepIds(value, stepIds));
  }
}

function validateStepReferences({ endpoint, context }) {
  // Collect all step IDs defined in the routine
  const stepIds = new Set();
  collectStepIds(endpoint.routine, stepIds);

  // Find _step references in the routine
  const stepRefs = new Map(); // topLevelKey -> configKey (first occurrence)

  traverseConfig({
    config: endpoint.routine,
    visitor: (obj) => {
      if (obj._step !== undefined) {
        const stepId = extractOperatorKey({ operatorValue: obj._step });
        if (stepId && !stepRefs.has(stepId)) {
          stepRefs.set(stepId, obj['~k']);
        }
      }
    },
  });

  // Warn for undefined step references
  stepRefs.forEach((configKey, stepId) => {
    if (stepIds.has(stepId)) return;

    const message =
      `_step references "${stepId}" in endpoint "${endpoint.endpointId}", ` +
      `but no step with id "${stepId}" exists in the routine. ` +
      `Step IDs are defined by the "id" property of each step. ` +
      `Check for typos or add a step with this id.`;

    context.logger.configWarning({ message, configKey, prodError: true, checkSlug: 'step-refs' });
  });
}

export default validateStepReferences;
