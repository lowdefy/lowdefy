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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

function collectCallAgentSteps(routine, steps) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectCallAgentSteps(item, steps));
    return;
  }
  if (type.isObject(routine)) {
    if (routine.type === 'CallAgent') {
      steps.push(routine);
    }
    // Recurse into all values (handles control structures like :then, :else, :try, :catch)
    Object.values(routine).forEach((value) => collectCallAgentSteps(value, steps));
  }
}

// Runs after buildAgents (needs context.agentIds and normalized agent.tools).
// Validates that CallAgent steps with a static agentId reference an existing
// agent, and warns when that agent has confirm tools — headless runs have no
// client to resolve an approval, so those tools auto-execute. Operator
// (dynamic) agentIds are skipped; they resolve at runtime.
function validateCallAgentSteps({ components, context }) {
  (components.api ?? []).forEach((endpoint) => {
    const steps = [];
    collectCallAgentSteps(endpoint.routine, steps);

    steps.forEach((step) => {
      const agentId = step.properties?.agentId;
      if (!type.isString(agentId)) return;

      if (!context.agentIds?.has(agentId)) {
        throw new ConfigError(
          `CallAgent step "${step.stepId}" at endpoint "${endpoint.endpointId}" references agent "${agentId}" which does not exist.`,
          { configKey: step['~k'] }
        );
      }

      const agent = (components.agents ?? []).find((a) => a.agentId === agentId);
      const hasConfirmTools = (agent?.tools ?? []).some((t) => t.confirm);
      if (hasConfirmTools) {
        context.handleWarning(
          new ConfigWarning(
            `Agent "${agentId}" has tools with confirm: true, but tool approval is not supported when run from a CallAgent step. Tools will auto-execute.`,
            { configKey: step['~k'] }
          )
        );
      }
    });
  });
  return components;
}

export default validateCallAgentSteps;
