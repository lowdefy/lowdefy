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

import { callEndpoint, getEndpointConfig, runDetachedEndpoint } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import fitResponse from './fitResponse.js';
import resolveToolCaller from './resolveToolCaller.js';
import withDataSession from './withDataSession.js';

// Executes an Api endpoint routine the same way POST /api/endpoints/<endpointId>
// does (src/routes/endpoints.js), but gated for agent use. Endpoints are not
// classified read/write - a routine has no checkWrite meta and a single routine
// can read, write and call other endpoints - so running one always needs the
// app's explicit opt-in via lowdefy.yaml's cli.agentTools.allowWriteRequests.
// Never throws for outcomes an agent should reason about: refusals, a :reject
// or :throw in the routine, and faults that escape callEndpoint (auth
// refusals, missing connections, InternalApi endpoints) all come back as data.
// Only malformed input throws, as a ConfigError.
//
// system: true runs the routine through runDetachedEndpoint instead - the same
// entry point POST /api/detached uses - so it executes as a system context
// exactly like a cron or detached run: no session, no user, `_user` undefined,
// endpoint auth not checked and InternalApi endpoints callable. That is the
// only local way to exercise a schedules-only InternalApi routine without
// CRON_SECRET. Nested CallApi steps with detached: true are not faked: they
// still dispatch over HTTP against the request origin and need CRON_SECRET.
//
// `user` and `data` name the caller as a journey's do (see resolveToolCaller):
// a user object, "none" (signed out) or a data set user's name. A data set
// runs the routine on that data set's own database.
async function runEndpoint({
  endpointId,
  payload = {},
  user,
  data,
  system = false,
  saveResponse = false,
  honoContext,
}) {
  if (type.isUndefined(endpointId) || !type.isString(endpointId)) {
    throw new ConfigError(
      `run_endpoint requires an "endpointId" string. Received ${JSON.stringify(endpointId)}.`
    );
  }

  if (!type.isBoolean(saveResponse)) {
    throw new ConfigError(
      `run_endpoint "saveResponse" must be a boolean. Received ${JSON.stringify(saveResponse)}.`
    );
  }

  if (!type.isNone(system) && !type.isBoolean(system)) {
    throw new ConfigError(
      `run_endpoint "system" must be a boolean. Received ${JSON.stringify(system)}.`
    );
  }

  if (system === true && !type.isNone(user)) {
    throw new ConfigError(
      'run_endpoint "system" cannot be combined with "user": a system run has no user (_user is undefined).'
    );
  }

  const caller = await resolveToolCaller({ user, data });
  if (!type.isUndefined(caller.error)) {
    throw new ConfigError(`run_endpoint: ${caller.error}`);
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

  const ran = await withDataSession({
    dataSet: caller.dataSet,
    task: ({ dataSession }) =>
      runEndpointInContext({
        endpointId,
        payload,
        user: caller.user,
        system,
        saveResponse,
        honoContext,
        dataSession,
      }),
  });
  // A data set that failed to load never ran the routine.
  if (type.isString(ran.error)) {
    return { refused: true, reason: ran.error };
  }
  return ran;
}

// The part of runEndpoint that runs in a Lowdefy context, on the data set's
// database when the call named one.
async function runEndpointInContext({
  endpointId,
  payload,
  user,
  system,
  saveResponse,
  honoContext,
  dataSession,
}) {
  // Deferred import: createLowdefyContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory - importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  // "none" injects no caller: the app's own auth resolves this call, which
  // carries no session, so it runs signed out.
  const context = await createLowdefyContext({
    c: honoContext,
    user: user === 'none' ? undefined : user,
    dataSession,
  });

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

  context.logger.info({ event: 'agent_run_endpoint', endpointId, user, system });

  try {
    // callEndpoint refuses InternalApi endpoints and enforces the endpoint's
    // auth and payloadSchema exactly as the HTTP route does. A :reject or
    // :throw resolves normally with success: false and the routine's own
    // error, so neither reaches the catch below.
    // The agent wrote the payload, so a payload the endpoint's payloadSchema
    // refuses is the agent's to correct (outsideCaller), not a config fault.
    const result = system
      ? await runDetachedEndpoint(context, { endpointId, outsideCaller: true, payload })
      : await callEndpoint(context, {
          blockId: undefined,
          endpointId,
          outsideCaller: true,
          pageId: undefined,
          payload,
        });
    return { refused: false, ...fitResponse({ result, name: endpointId, saveResponse }) };
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
