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
import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import buildEndpointResult from '../../response/buildEndpointResult.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getEndpointConfig from './getEndpointConfig.js';
import logEndpointCompleted from './logEndpointCompleted.js';
import resolveRunAs from './resolveRunAs.js';
import runRoutine from './runRoutine.js';
import scheduleBackground from './scheduleBackground.js';
import validateEndpointResponse from './validateEndpointResponse.js';
import validatePayload from './validatePayload.js';

// `trace` is an optional dev-only collector (the `explain` flag of
// lowdefy_run_endpoint): an array the caller allocates, which handleRequest
// fills with one entry per request step. Absent, nothing changes.
async function callEndpoint(context, { blockId, endpointId, pageId, payload, trace }) {
  const { logger } = context;

  context.blockId = blockId;
  context.endpointId = endpointId;
  context.pageId = pageId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_endpoint', blockId, endpointId, pageId, payload });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  // Block HTTP access to InternalApi endpoints - same error as a missing
  // endpoint, including the guarded unauthenticated fork, so an internal
  // endpoint is indistinguishable from one that does not exist on both paths.
  if (endpointConfig.type === 'InternalApi') {
    const unauthenticatedHuman =
      type.isNone(context.user) && !type.isNone(context.authEnforcement) && context.system !== true;
    const err = unauthenticatedHuman
      ? new AuthenticationError(`Authentication required for API endpoint "${endpointId}".`)
      : new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }

  authorizeApiEndpoint(context, { endpointConfig });

  // Validated once here, before the routine context exists, so REST, MCP and
  // the async fork below all run on a payload that matches the declared schema.
  // A caller that sends no payload - a CallAPI action without params.payload, a
  // REST body without the key - is calling with an empty payload. It is
  // defaulted here, at the single boundary every caller enters through, so a
  // payloadSchema sees the same `{}` it sees when the key is sent explicitly.
  const sentPayload = serializer.deserialize(payload);
  const deserializedPayload = type.isNone(sentPayload) ? {} : sentPayload;
  validatePayload({ endpointConfig, payload: deserializedPayload });

  const routineContext = {
    steps: {},
    payload: deserializedPayload,
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
    trace,
  };
  // The endpoint's runAs scopes every walled step of this run (a step-level
  // runAs overrides it). Resolved against the fresh routine context, so it can
  // read _user, _secret or a literal, never a step result or the payload.
  routineContext.runAs = resolveRunAs(context, routineContext, {
    runAs: endpointConfig.runAs,
    location: endpointId,
    configKey: endpointConfig['~k'],
    source: 'endpoint',
  });

  // async: true — acknowledge now, run the routine in the background.
  // Auth was already checked above; the outcome lands in logs (scheduleBackground)
  // and in whatever the routine itself records.
  if (endpointConfig.async === true) {
    scheduleBackground(context, { endpointConfig, event: 'background_endpoint', endpointId }, () =>
      runRoutine(context, routineContext, { routine: endpointConfig.routine })
    );
    return {
      error: null,
      response: serializer.serialize({ accepted: true }),
      status: 'accepted',
      success: true,
    };
  }

  const startTime = performance.now();
  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });
  logEndpointCompleted(context, {
    endpointConfig,
    entry: 'api',
    error,
    startTime,
    status,
  });
  if (status === 'return') {
    validateEndpointResponse(context, { endpointConfig, response });
  }

  return buildEndpointResult(context, { error, response, status });
}

export default callEndpoint;
