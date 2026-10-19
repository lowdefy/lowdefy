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

import loadDynamicArtifacts from '../page/dynamic/loadDynamicArtifacts.js';
import addStepResult from './addStepResult.js';
import evaluateRoutineOperators from './evaluateRoutineOperators.js';

// Returns what a dynamic blocks policy allows, with the properties schema of each
// allowed block and the params schema of each allowed action and operator, so a generator's prompt is derived from the policy
// rather than written by hand and left to drift from it.
async function handleDescribeDynamicPolicy(context, routineContext, { step }) {
  const { policy: policyId } = evaluateRoutineOperators(context, routineContext, {
    input: step.properties,
    location: step.stepId,
  });
  const [{ blockSchemas, dynamicPolicies }, actionSchemas, operatorSchemas] = await Promise.all([
    loadDynamicArtifacts(context),
    context.readConfigFile('plugins/actionSchemas.json'),
    context.readConfigFile('plugins/operatorSchemas.json'),
  ]);
  const policy = dynamicPolicies[policyId];
  const blocks = {};
  policy.blocks.forEach((blockType) => {
    blocks[blockType] = blockSchemas[blockType]?.properties?.properties ?? null;
  });
  const actions = {};
  policy.actions.forEach((actionType) => {
    actions[actionType] = actionSchemas?.[actionType] ?? null;
  });
  const operators = {};
  policy.operators.forEach((operator) => {
    operators[operator] = operatorSchemas?.[operator] ?? null;
  });
  const result = {
    id: policy.id,
    blocks,
    actions,
    operators,
    endpoints: policy.endpoints,
    requests: policy.requests,
    links: policy.links,
    state: policy.state,
    html: policy.html,
    limits: policy.limits,
  };
  addStepResult(context, routineContext, { result, stepId: step.stepId });
  return { status: 'continue' };
}

export default handleDescribeDynamicPolicy;
