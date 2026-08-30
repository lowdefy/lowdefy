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

// Compiled validators keyed by endpointId (the field the build artifact carries). The cached schema is compared by
// object identity with the endpoint's current payloadSchema: a dev rebuild
// re-reads the config file and yields a new object, so an edited schema is
// recompiled on its next call, while a stable production artifact compiles once.
const validators = new Map();

function getValidator({ endpointConfig }) {
  const cached = validators.get(endpointConfig.endpointId);
  if (cached && cached.schema === endpointConfig.payloadSchema) {
    return cached.validate;
  }
  // A schema ajv cannot compile throws here, on the first call - not swallowed.
  const validate = compile({ schema: cleanBuildArtifact(endpointConfig.payloadSchema) });
  validators.set(endpointConfig.endpointId, { schema: endpointConfig.payloadSchema, validate });
  return validate;
}

function buildErrorMessage({ endpointConfig, errors }) {
  const first = errors[0];
  const path = first.instancePath || '(root)';
  let message = `Payload for endpoint "${endpointConfig.endpointId}" does not match its payloadSchema at ${path}: ${first.message}.`;
  if (errors.length > 1) {
    message += ` (and ${errors.length - 1} more)`;
  }
  return message;
}

// A declared payloadSchema is enforced on every caller; the only way to not
// enforce is to not declare one (design decision D2).
function validatePayload({ endpointConfig, payload }) {
  if (type.isNone(endpointConfig.payloadSchema)) {
    return;
  }
  const validate = getValidator({ endpointConfig });
  const { valid, errors } = validate(payload);
  if (valid) {
    return;
  }
  // UserError: a caller sending the wrong shape is an expected outcome of the
  // caller's own request, not a config or system fault - the same class the
  // ValidateSchema step uses. It is never logged at error level or sent to
  // Sentry, and the ajv error array survives as cause so the caller can see
  // exactly what to fix.
  throw new UserError(buildErrorMessage({ endpointConfig, errors }), { cause: errors });
}

export default validatePayload;
