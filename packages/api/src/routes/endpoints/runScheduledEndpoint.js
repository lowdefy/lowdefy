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

import { serializer } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import applySystemTrust from '../../context/applySystemTrust.js';
import buildEndpointResult from '../../response/buildEndpointResult.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import detachRequestSignal from './detachRequestSignal.js';
import getEndpointConfig from './getEndpointConfig.js';
import logEndpointCompleted from './logEndpointCompleted.js';
import resolveRunAs from './resolveRunAs.js';
import runRoutine from './runRoutine.js';
import scheduleBackground from './scheduleBackground.js';
import validatePayload from './validatePayload.js';

// Runs an endpoint routine on a schedule (cron). Unlike callEndpoint this does NOT check the
// endpoint's `auth` config and does NOT block InternalApi: a cron run is authorized by the transport
// layer (CRON_SECRET) plus the endpoint declaring the firing schedule, and runs as a system context
// (no user session, so `_user` resolves to undefined). An InternalApi with schedules is therefore a
// cron-only endpoint that is never client-callable.
async function runScheduledEndpoint(context, { endpointId, cron }) {
  const { logger } = context;

  detachRequestSignal(context);

  context.endpointId = endpointId;
  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_scheduled_endpoint', endpointId, cron });
  const endpointConfig = await getEndpointConfig(context, { endpointId });

  const schedules = endpointConfig.schedules;
  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new ConfigError(`API Endpoint "${endpointId}" is not scheduled.`);
  }

  // Vercel sends the firing expression in x-vercel-cron-schedule; cron expressions are unique per
  // endpoint (enforced at build) so this is unambiguous. Without a cron (e.g. local testing) fall
  // back to the single schedule, otherwise require it to disambiguate the payload.
  let schedule;
  if (cron) {
    schedule = schedules.find((s) => s.cron === cron);
  } else if (schedules.length === 1) {
    schedule = schedules[0];
  }
  if (!schedule) {
    throw new ConfigError(`No schedule matching cron "${cron}" for API Endpoint "${endpointId}".`);
  }

  // Cron is trusted at the transport (CRON_SECRET), so it holds a system
  // context from construction, regardless of any session cookie sent with the
  // request (Decisions 1, 2). The request context is a pre-resolved substitute
  // writer for resolveAuthentication - the engine's single-writer carve-out -
  // and applySystemTrust sets the same invariant bundle createSystemContext
  // produces for the hook path.
  applySystemTrust(context);

  // A scheduler is a caller too: an authored schedule.payload that breaks the
  // endpoint's own contract is a bug worth failing loudly on.
  const schedulePayload = schedule.payload ?? {};
  validatePayload({ endpointConfig, payload: schedulePayload });

  const routineContext = {
    steps: {},
    payload: schedulePayload,
    arrayIndices: [],
    items: {},
    state: {},
    endpointDepth: 0,
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

  // async: true — acknowledge the cron trigger immediately and run in the
  // background; transport auth (CRON_SECRET) already passed at the route.
  if (endpointConfig.async === true) {
    scheduleBackground(context, { endpointConfig, event: 'background_scheduled_endpoint', endpointId }, () =>
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
    entry: 'scheduled',
    error,
    startTime,
    status,
  });

  return buildEndpointResult(context, { error, response, status });
}

export default runScheduledEndpoint;
