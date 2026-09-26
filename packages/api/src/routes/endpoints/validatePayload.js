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

import { compile } from '@lowdefy/ajv';
import { UserError } from '@lowdefy/errors';
import { cleanBuildArtifact, type } from '@lowdefy/helpers';

// Compiled validators keyed by the payloadSchema object: a dev rebuild re-reads
// the config file and yields a new object, so an edited schema is recompiled on
// its next call, while a stable production artifact compiles once. Keying by the
// object rather than the endpoint id also keeps two apps served by one process
// from sharing an entry.
const validators = new WeakMap();

function getValidator({ payloadSchema }) {
  let validate = validators.get(payloadSchema);
  if (!validate) {
    // A schema ajv cannot compile throws here, on the first call - not swallowed.
    validate = compile({ schema: cleanBuildArtifact(payloadSchema) });
    validators.set(payloadSchema, validate);
  }
  return validate;
}

// ajv (allErrors) reports every failing keyword, so a `type: [string, 'null']`
// with an `enum` reports the type miss first. These keywords say what would be
// accepted, so one of them wins over a `type` error on the same path; any other
// keyword keeps ajv's order.
const SPECIFIC_KEYWORDS = ['enum', 'pattern', 'required', 'additionalProperties'];

function pickError({ errors }) {
  const first = errors[0];
  if (first.keyword !== 'type') {
    return first;
  }
  return (
    errors.find(
      (error) =>
        error.instancePath === first.instancePath && SPECIFIC_KEYWORDS.includes(error.keyword)
    ) ?? first
  );
}

function formatValue(value) {
  if (type.isString(value)) {
    return value;
  }
  return JSON.stringify(value);
}

function additionalPropertyNames({ errors, instancePath }) {
  return errors
    .filter(
      (error) => error.keyword === 'additionalProperties' && error.instancePath === instancePath
    )
    .map((error) => error.params.additionalProperty);
}

// ajv's pattern and required messages already name the pattern and the
// property; enum and additionalProperties messages name neither.
function describeError({ error, errors }) {
  if (error.keyword === 'enum') {
    return `${error.message} (${error.params.allowedValues.map(formatValue).join(', ')})`;
  }
  if (error.keyword === 'additionalProperties') {
    const names = additionalPropertyNames({ errors, instancePath: error.instancePath });
    return `${error.message} (${names.join(', ')})`;
  }
  return error.message;
}

// A `type` error on a path that also has a specific error is the same problem
// reported twice, and the listed additional properties are one problem.
function countFurtherProblems({ errors, chosen }) {
  const specificPaths = new Set(
    errors
      .filter((error) => SPECIFIC_KEYWORDS.includes(error.keyword))
      .map((error) => error.instancePath)
  );
  return errors.filter((error) => {
    if (error === chosen) {
      return false;
    }
    if (error.keyword === 'type' && specificPaths.has(error.instancePath)) {
      return false;
    }
    return !(
      chosen.keyword === 'additionalProperties' &&
      error.keyword === 'additionalProperties' &&
      error.instancePath === chosen.instancePath
    );
  }).length;
}

function buildErrorMessage({ endpointConfig, errors }) {
  const chosen = pickError({ errors });
  const path = chosen.instancePath || '(root)';
  let message = `Payload for endpoint "${
    endpointConfig.endpointId
  }" does not match its payloadSchema at ${path}: ${describeError({
    error: chosen,
    errors,
  })}.`;
  const more = countFurtherProblems({ errors, chosen });
  if (more > 0) {
    message += ` (and ${more} more)`;
  }
  return message;
}

// A declared payloadSchema is enforced on every caller; the only way to not
// enforce it is to not declare one.
function validatePayload({ endpointConfig, payload }) {
  if (type.isNone(endpointConfig.payloadSchema)) {
    return;
  }
  const validate = getValidator({ payloadSchema: endpointConfig.payloadSchema });
  const { valid, errors } = validate(payload);
  if (valid) {
    return;
  }
  // UserError: a caller sending the wrong shape is an expected outcome of the
  // caller's own request, not a config or system fault - the same class the
  // ValidateSchema step uses. It is never logged at error level or sent to
  // Sentry, and the ajv error array survives as cause.
  throw new UserError(buildErrorMessage({ endpointConfig, errors }), { cause: errors });
}

export default validatePayload;
