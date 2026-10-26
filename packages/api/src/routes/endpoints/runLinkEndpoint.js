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

import authorizeApiEndpoint from './authorizeApiEndpoint.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createLinkAnswer from './createLinkAnswer.js';
import getEndpointConfig from './getEndpointConfig.js';
import matchLinkEndpoint from './matchLinkEndpoint.js';
import runRoutine from './runRoutine.js';
import validatePayload from './validatePayload.js';

const refusalStatuses = {
  AuthenticationError: 401,
  AuthorizationError: 403,
  TwoFactorEnrolmentRequiredError: 403,
};

// The caller's auth refused as a status with no body: an image load cannot read one. It goes
// through authorizeApiEndpoint, as every endpoint route does, so the refusal rules (roles,
// two-factor enrolment) stay in one place; only the errors it throws are read as statuses here.
function getRefusalStatus(context, { endpointConfig }) {
  try {
    authorizeApiEndpoint(context, { endpointConfig });
    return null;
  } catch (error) {
    if (Object.hasOwn(refusalStatuses, error.name)) {
      return refusalStatuses[error.name];
    }
    throw error;
  }
}

// A payload the endpoint's payloadSchema refuses is the caller's own mistake (the URL is theirs),
// answered 400 with no body like the other refusals, and logged without the path.
function getPayloadRefusalStatus(context, { endpointConfig, payload }) {
  try {
    validatePayload({ endpointConfig, payload, outsideCaller: true });
    return null;
  } catch (error) {
    if (error.name !== 'UserError') {
      throw error;
    }
    context.logger.debug(
      { event: 'debug_link_payload_refused', endpointId: endpointConfig.endpointId },
      error.message
    );
    return 400;
  }
}

// A GET that names no link endpoint. An anonymous human on an app with auth gets the same 401 a
// protected link answers, as getEndpointConfig does for an unknown endpoint, so a signed-out
// caller cannot tell which link ids exist.
function answerUnmatched({ authEnforcement, system, user }) {
  if (type.isNone(user) && !type.isNone(authEnforcement) && system !== true) {
    return { status: 401 };
  }
  return { status: 404, body: { error: 'Not found.' } };
}

// Runs an endpoint declared `link: true` for a GET on /api/endpoints/<endpointId>/<path...>,
// typically an <img src> or a download link, so a private file is served at a URL that does
// not expire. The routine runs as the session caller, with the endpoint's auth applied as on a
// CallAPI call, and receives { path, query } as payload. It returns the HTTP answer the route
// sends: { status, location } for the 302 to the URL the routine returned, else { status, body? }
// (see createLinkAnswer). segments are the decoded path segments after /api/endpoints/.
async function runLinkEndpoint(context, { segments, query }) {
  const linkEndpoints = await context.readConfigFile('linkEndpoints.json');
  const match = matchLinkEndpoint({ linkEndpoints, segments });
  if (type.isNone(match)) {
    return answerUnmatched(context);
  }
  const { endpointId, path } = match;
  context.endpointId = endpointId;
  context.evaluateOperators = createEvaluateOperators(context);

  // The id only: the path can be a file name. (The request log line still records the URL path,
  // as it does on every route.)
  context.logger.info({ event: 'call_link_endpoint', endpointId });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  const refusalStatus = getRefusalStatus(context, { endpointConfig });
  if (!type.isNone(refusalStatus)) {
    return { status: refusalStatus };
  }

  const payload = { path, query };
  const payloadRefusalStatus = getPayloadRefusalStatus(context, { endpointConfig, payload });
  if (!type.isNone(payloadRefusalStatus)) {
    return { status: payloadRefusalStatus };
  }

  const routineContext = {
    steps: {},
    payload,
    arrayIndices: [],
    error: null,
    items: {},
    state: {},
    endpointDepth: 0,
  };
  const { error, response, status } = await runRoutine(context, routineContext, {
    routine: endpointConfig.routine,
  });
  return createLinkAnswer(context, { endpointConfig, error, response, status });
}

export default runLinkEndpoint;
