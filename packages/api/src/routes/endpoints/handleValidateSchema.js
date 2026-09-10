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

import { validate } from '@lowdefy/ajv';
import { UserError } from '@lowdefy/errors';

import addStepResult from './addStepResult.js';

function buildErrorMessage(errors, stepId) {
  const first = errors?.[0];
  if (!first) return `ValidateSchema step "${stepId}" failed.`;
  const path = first.instancePath || '(root)';
  return `ValidateSchema step "${stepId}" failed at ${path}: ${first.message}.`;
}

async function handleValidateSchema(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_validate_schema',
    step,
  });

  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    steps: routineContext.steps,
  });

  const { schema, data, throwOnInvalid = true } = evaluatedProperties;
  const { valid, errors } = validate({ schema, data, returnErrors: true });
  const result = { valid, errors: errors ?? [] };

  addStepResult(context, routineContext, {
    result,
    stepId: step.stepId,
  });

  if (!valid && throwOnInvalid) {
    // Failed validation of caller-supplied data is an expected user outcome,
    // not a config or system fault.
    const error = new UserError(buildErrorMessage(result.errors, step.stepId), {
      cause: result.errors,
    });
    // Log under `err` — see controlThrow: only the `err` key runs the pino error
    // serializer, so `error` would drop the message from the log line.
    logger.warn({
      event: 'warn_validate_schema',
      stepId: step.stepId,
      err: error,
    });
    return { status: 'error', error };
  }

  logger.debug({
    event: 'debug_end_validate_schema',
    stepId: step.stepId,
    valid,
  });

  return { status: 'continue' };
}

export default handleValidateSchema;
