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

import { callEndpoint } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import formatExplainTrace from './formatExplainTrace.js';
import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import readBuildArtifact from './readBuildArtifact.js';
import runWithDevContext from './runWithDevContext.js';

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
// `explain: true` allocates a trace collector that callEndpoint fills with one
// entry per request step (control steps contribute nothing) and adds an
// `explain` array to the result, each entry carrying its stepId. Without it
// nothing is allocated and the result is unchanged.
async function runEndpoint({ endpointId, payload = {}, user, explain = false, honoContext }) {
  if (type.isUndefined(endpointId) || !type.isString(endpointId)) {
    throw new ConfigError(
      `run_endpoint requires an "endpointId" string. Received ${JSON.stringify(endpointId)}.`
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

  // The endpoint artifact is the same file getEndpointConfig reads through
  // readConfigFile, so a typo'd id is answered here instead of after a full
  // context construction (a tenant preflight probe and the dynamic js map).
  if (readBuildArtifact({ name: `api/${endpointId}.json` }) === null) {
    return {
      refused: true,
      reason:
        `Endpoint "${endpointId}" was not found. ` +
        `See GET /lowdefy-docs/app-map for the endpoints that exist.`,
    };
  }

  return runWithDevContext({
    createTrace: () => [],
    explain,
    // callEndpoint records one trace entry per request step; a control-only
    // routine contributes none and explain comes back as an empty array.
    formatExplain: ({ context, trace }) =>
      trace.map((stepTrace) =>
        formatExplainTrace({
          trace: stepTrace,
          requestType: stepTrace.connection?.type ?? 'unknown',
          secrets: context.secrets,
          user: context.user,
        })
      ),
    honoContext,
    // The resolved caller, not the raw argument: a fixture name, an inline
    // object and the roleless default all read the same in the terminal, and
    // this is the identity the routine actually ran as.
    log: ({ context }) =>
      context.logger.info({
        event: 'agent_run_endpoint',
        endpointId,
        user: { id: context.user?.id ?? null, roles: context.user?.roles ?? [] },
      }),
    // callEndpoint refuses InternalApi endpoints and enforces the endpoint's
    // auth and payloadSchema exactly as the HTTP route does. A :reject or
    // :throw resolves normally with success: false and the routine's own
    // error, so neither reaches the fault path.
    run: ({ context, trace }) =>
      callEndpoint(context, {
        blockId: undefined,
        endpointId,
        pageId: undefined,
        payload,
        trace,
      }),
    user,
  });
}

export default runEndpoint;
