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
import { cleanBuildArtifact, type } from '@lowdefy/helpers';

// Compiled validators keyed by endpointId, compared by schema object identity
// like validatePayload: a dev rebuild yields a new responseSchema object, so an
// edited schema is recompiled on its next call.
const validators = new Map();

function getValidator({ endpointConfig }) {
  const cached = validators.get(endpointConfig.endpointId);
  if (cached && cached.schema === endpointConfig.responseSchema) {
    return cached.validate;
  }
  const validate = compile({ schema: cleanBuildArtifact(endpointConfig.responseSchema) });
  validators.set(endpointConfig.endpointId, { schema: endpointConfig.responseSchema, validate });
  return validate;
}

// A :return value that misses the endpoint's responseSchema is a dev notice,
// never a failure: the response is still returned, and production - which
// installs no context.handleDevNotice - compiles nothing. In prod a mismatch
// is the app's data changing, not a config fault to turn into a 500.
function validateEndpointResponse(context, { endpointConfig, response }) {
  if (type.isNone(context.handleDevNotice) || type.isNone(endpointConfig.responseSchema)) {
    return;
  }
  const validate = getValidator({ endpointConfig });
  const { valid, errors } = validate(response);
  if (valid) {
    return;
  }
  const first = errors[0];
  const instancePath = first.instancePath || '(root)';
  let message = `Endpoint "${endpointConfig.endpointId}" returned a response that does not match its responseSchema at ${instancePath}: ${first.message}.`;
  if (errors.length > 1) {
    message += ` (and ${errors.length - 1} more)`;
  }
  context.handleDevNotice({
    name: 'ResponseSchemaWarning',
    level: 'warn',
    message,
    configKey: endpointConfig['~k'],
    details: {
      endpointId: endpointConfig.endpointId,
      instancePath,
      errors,
      received: response,
    },
  });
}

export default validateEndpointResponse;
