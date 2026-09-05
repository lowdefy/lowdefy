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

import { callEndpoint, getEndpointConfig } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import truncateResponse from './truncateResponse.js';

// Executes an Api endpoint routine the same way POST /api/endpoints/<endpointId>
// does (src/routes/endpoints.js), but gated for agent use. Endpoints are not
// classified read/write - a routine has no checkWrite meta and a single routine
// can read, write and call other endpoints - so running one always needs the
// app's explicit opt-in via lowdefy.yaml's cli.agentTools.allowWriteRequests.
// Never throws for outcomes an agent should reason about: refusals, a :reject
// or :throw in the routine, and faults that escape callEndpoint (auth
// refusals, missing connections, InternalApi endpoints) all come back as data.
// Only malformed input throws, as a ConfigError.
async function runEndpoint({ endpointId, payload = {}, user, honoContext }) {
  if (type.isUndefined(endpointId) || !type.isString(endpointId)) {
    throw new ConfigError(
      `run_endpoint requires an "endpointId" string. Received ${JSON.stringify(endpointId)}.`
    );
  }

  if (!type.isNone(user) && !type.isObject(user)) {
    throw new ConfigError(
      `run_endpoint "user" must be an object, e.g. {"roles":["admin"]}. Received ${JSON.stringify(
        user
      )}.`
    );
  }

  const allowed = await isWriteRequestsAllowed();
  if (!allowed) {
    return {
      refused: true,
      reason:
        'Api endpoint routines are not classified read-only — a routine can write, call other endpoints and send notifications — so running one needs agent write access.',
      howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
    };
  }

  // Deferred import: createLowdefyContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory - importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  const context = await createLowdefyContext({ c: honoContext, user });

  // getEndpointConfig needs the context's readConfigFile, so the endpoint is
  // resolved after the context is built. Its not-found ConfigError is answered
  // as a refusal rather than allowed to escape.
  try {
    await getEndpointConfig(context, { endpointId });
  } catch {
    return {
      refused: true,
      reason:
        `Endpoint "${endpointId}" was not found. ` +
        `See GET /lowdefy-docs/app-map for the endpoints that exist.`,
    };
  }

  context.logger.info({ event: 'agent_run_endpoint', endpointId, user });

  try {
    // callEndpoint refuses InternalApi endpoints and enforces the endpoint's
    // auth and payloadSchema exactly as the HTTP route does. A :reject or
    // :throw resolves normally with success: false and the routine's own
    // error, so neither reaches the catch below.
    const result = await callEndpoint(context, {
      blockId: undefined,
      endpointId,
      pageId: undefined,
      payload,
    });
    return { refused: false, ...truncateResponse(result) };
  } catch (error) {
    return {
      refused: false,
      error: {
        name: error.name,
        message: error.message,
        source: error.source,
        configKey: error.configKey,
      },
    };
  }
}

export default runEndpoint;
