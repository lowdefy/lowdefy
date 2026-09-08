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
import { ConfigError } from '@lowdefy/errors';

import findSchedule from './findSchedule.js';
import getEndpointConfig from './getEndpointConfig.js';
import getEnvironmentSchedules from './getEnvironmentSchedules.js';
import scheduleBackground from './scheduleBackground.js';

// Vercel fires cron jobs only on the production deployment, so the schedules of every other
// environment are registered there as /api/cron-forward/<environment>/<endpointId> jobs. When one
// fires, this pings the environment's own /api/cron/<endpointId> with that environment's
// CRON_SECRET (a Lowdefy secret named in config.cron.environments) so the environment runs its own
// code, and answers Vercel immediately: the ping is fire-and-forget, kept alive by scheduleBackground
// and bounded by the function duration, and its outcome exists only in the logs.
async function forwardScheduledEndpoint(context, { environment, endpointId, cron }) {
  const { config, logger, secrets } = context;

  const target = config?.cron?.environments?.[environment];
  if (!type.isObject(target)) {
    throw new ConfigError(
      `Cron environment "${environment}" is not declared in lowdefy.config.cron.environments.`
    );
  }
  if (type.isUndefined(target.url)) {
    throw new ConfigError(
      `Cron environment "${environment}" has no url to forward to: it is the environment that runs the crons.`
    );
  }
  if (target.enabled === false) {
    throw new ConfigError(`Cron environment "${environment}" is disabled.`);
  }
  const secret = secrets?.[target.secret];
  if (!type.isString(secret) || secret === '') {
    throw new ConfigError(
      `Secret "${target.secret}" holding the CRON_SECRET of cron environment "${environment}" is not set. Set the LOWDEFY_SECRET_${target.secret} environment variable on this deployment.`
    );
  }

  // The same build is deployed to every environment, so the local artifact says whether the target
  // declares the firing schedule: fail here with a config error instead of having the target 500.
  const endpointConfig = await getEndpointConfig(context, { endpointId });
  const schedules = getEnvironmentSchedules({ endpointConfig, environment });
  findSchedule({ schedules, cron, endpointId, environment });

  const url = `${target.url.replace(/\/+$/, '')}/api/cron/${endpointId}`;
  const timeoutMs = (config?.vercel?.maxDuration ?? 60) * 1000;
  const headers = { authorization: `Bearer ${secret}` };
  if (cron) headers['x-vercel-cron-schedule'] = cron;
  headers['x-lowdefy-cron-environment'] = environment;

  logger.info({ event: 'forward_scheduled_endpoint', endpointId, environment, cron, url });
  scheduleBackground(context, { event: 'forward_scheduled_endpoint', endpointId }, async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Drain the body so the connection is released; the target logs its own outcome.
    await response.arrayBuffer();
    if (!response.ok) {
      throw new Error(
        `Forwarded cron for environment "${environment}" at ${url} responded ${response.status}.`
      );
    }
    return { status: response.status };
  });

  return {
    error: null,
    response: serializer.serialize({ accepted: true, environment, endpointId }),
    status: 'accepted',
    success: true,
  };
}

export default forwardScheduledEndpoint;
