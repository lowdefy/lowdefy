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

import { compile, toJsonShape } from '@lowdefy/ajv';
import { cleanBuildArtifact, type } from '@lowdefy/helpers';

// Keyed by the schema object rather than the endpoint id: two apps served by
// one process share an id space, and a dev rebuild yields a new schema object
// that must recompile. The WeakMap lets a replaced schema be collected.
const validators = new WeakMap();

function getValidator({ endpointConfig }) {
  let validate = validators.get(endpointConfig.responseSchema);
  if (!validate) {
    validate = compile({ schema: cleanBuildArtifact(endpointConfig.responseSchema) });
    validators.set(endpointConfig.responseSchema, validate);
  }
  return validate;
}

// One line per endpoint per process in production: an endpoint whose data has
// drifted from the shape its callers were built against is worth knowing about,
// and a line per request would be a log flood for a condition that does not
// change between requests.
const reportedEndpoints = new Set();

function report(context, { endpointConfig, message, notice }) {
  if (!type.isNone(context.handleDevNotice)) {
    context.handleDevNotice(notice);
    return;
  }
  if (reportedEndpoints.has(endpointConfig.endpointId)) return;
  reportedEndpoints.add(endpointConfig.endpointId);
  context.logger.warn({ event: 'response_schema_warning', ...notice.details }, message);
}

// A :return value that misses the endpoint's responseSchema is a notice, never
// a failure: the response is still returned, because in production a mismatch
// is the app's data changing, not a config fault to turn into a 500. The check
// runs in both stages; only the channel differs.
//
// The value is validated in its JSON shape, which is what a caller receives and
// what the same schema is published as through MCP's outputSchema - so a Date
// returned for a `format: date-time` field is correct rather than a false
// alarm.
function validateEndpointResponse(context, { endpointConfig, response }) {
  if (type.isNone(endpointConfig.responseSchema)) {
    return;
  }
  const validate = getValidator({ endpointConfig });
  const { valid, errors } = validate(toJsonShape({ value: response }));
  if (valid) {
    return;
  }
  const first = errors[0];
  const instancePath = first.instancePath || '(root)';
  let message = `Endpoint "${endpointConfig.endpointId}" returned a response that does not match its responseSchema at ${instancePath}: ${first.message}.`;
  if (errors.length > 1) {
    message += ` (and ${errors.length - 1} more)`;
  }
  report(context, {
    endpointConfig,
    message,
    notice: {
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
    },
  });
}

export default validateEndpointResponse;
