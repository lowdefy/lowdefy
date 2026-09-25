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

import { serializer, type } from '@lowdefy/helpers';
import { UserError } from '@lowdefy/errors';

import checkDynamicContent from '../page/dynamic/checkDynamicContent.js';
import loadDynamicArtifacts from '../page/dynamic/loadDynamicArtifacts.js';
import addStepResult from './addStepResult.js';
import evaluateRoutineOperators from './evaluateRoutineOperators.js';

// Checks content against a dynamic policy with the same function page get
// uses, so content that passes here renders. The result lists every violation
// with its path into the content, for a generator to correct and retry.
async function handleValidateDynamic(context, routineContext, { step }) {
  const { logger } = context;

  logger.debug({ event: 'debug_start_validate_dynamic', step });

  const {
    blocks,
    policy: policyId,
    throwOnInvalid = true,
  } = evaluateRoutineOperators(context, routineContext, {
    input: step.properties,
    location: step.stepId,
  });
  const artifacts = await loadDynamicArtifacts(context);
  const policy = artifacts.dynamicPolicies[policyId];

  let errors;
  if (!type.isArray(blocks)) {
    errors = [
      {
        path: 'blocks',
        rule: 'shape',
        message: `Content should be an array of blocks. Received ${JSON.stringify(blocks)}.`,
      },
    ];
  } else {
    const result = await checkDynamicContent(context, {
      artifacts,
      // buildBlock mutates the content; the caller's value stays as given.
      blocks: serializer.copy(blocks),
      dynamicBlockId: step.stepId,
      idPrefix: `validate:${step.stepId}`,
      pageId: `endpoint:${step.endpointId}`,
      pageRequests: null,
      policy,
      usedTypes: { actions: new Set(), blocks: new Set(), operators: new Set() },
    });
    errors = result.errors.map(({ path, rule, message }) => ({ path, rule, message }));
  }
  const result = { valid: errors.length === 0, errors, blocks };
  // A Dynamic block's endpoint may return these blocks as config, if this
  // step checked them against the block's own policy.
  if (result.valid && routineContext.literalData?.policyId === policyId) {
    routineContext.literalData.validatedStepIds.add(step.stepId);
  }

  addStepResult(context, routineContext, { result, stepId: step.stepId });

  if (!result.valid && throwOnInvalid) {
    // Invalid generated content is an expected outcome, not a config fault.
    const error = new UserError(
      `ValidateDynamic step "${step.stepId}" failed: ${errors[0].path}: ${errors[0].message}`,
      { cause: errors }
    );
    logger.warn({ event: 'warn_validate_dynamic', stepId: step.stepId, err: error });
    return { status: 'error', error };
  }

  logger.debug({ event: 'debug_end_validate_dynamic', stepId: step.stepId, valid: result.valid });
  return { status: 'continue' };
}

export default handleValidateDynamic;
