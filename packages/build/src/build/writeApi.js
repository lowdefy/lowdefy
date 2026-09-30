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
import { LowdefyInternalError } from '@lowdefy/errors';
import { type, serializer } from '@lowdefy/helpers';

import getEnvironmentNames from '../utils/getEnvironmentNames.js';

async function writeEndpoint({ endpoint, context }) {
  await context.writeBuildArtifact(
    `api/${endpoint.endpointId}.json`,
    serializer.serializeToString(endpoint ?? {})
  );
}

// Flat manifest of every scheduled endpoint, consumed by the Vercel Build Output assembly to
// generate the `crons` array in config.json. The runtime reads schedules off the endpoint artifact
// directly, so it does not depend on this file.
//
// With config.environments declared there is one entry per registered environment and schedule:
// `environment` names it and `forward` is true for environments this deployment forwards to.
// Vercel fires crons only on production, so:
//   - the current environment registers its own schedules;
//   - an environment with a cron.secret is forwarded to, so its own crons never fire it; any other
//     current environment is the one Vercel fires crons on and also registers every forwarded
//     environment's schedules;
//   - without a current environment only the `default` schedules are registered;
//   - cron.enabled: false registers nothing for that environment.
function getSchedules({ endpoint, key }) {
  if (type.isArray(endpoint.schedules)) return endpoint.schedules;
  return endpoint.schedules?.[key] ?? [];
}

function toManifestEntries({ endpoint, key, environment, forward }) {
  return getSchedules({ endpoint, key }).map((schedule) => ({
    endpointId: endpoint.endpointId,
    cron: schedule.cron,
    payload: schedule.payload ?? {},
    ...(type.isUndefined(environment) ? {} : { environment, forward }),
  }));
}

function isCronEnabled(environment) {
  return environment.cron?.enabled !== false;
}

function isForwardTarget(environment) {
  return !type.isUndefined(environment.cron?.secret);
}

function getRegisteredEnvironments({ environments, current }) {
  const registered = [];
  if (isCronEnabled(environments[current])) {
    registered.push({ name: current, forward: false });
  }
  if (isForwardTarget(environments[current])) return registered;
  getEnvironmentNames(environments).forEach((name) => {
    const environment = environments[name];
    if (name === current || !isForwardTarget(environment) || !isCronEnabled(environment)) return;
    registered.push({ name, forward: true });
  });
  return registered;
}

async function writeSchedulesManifest({ components, context }) {
  const { environments, environment: current } = components.config ?? {};
  const declared = getEnvironmentNames(environments).length > 0;
  const registered =
    declared && !type.isUndefined(current)
      ? getRegisteredEnvironments({ environments, current })
      : [];
  const schedules = [];
  (components.api ?? []).forEach((endpoint) => {
    if (!declared) {
      schedules.push(...toManifestEntries({ endpoint }));
      return;
    }
    if (type.isUndefined(current)) {
      schedules.push(...toManifestEntries({ endpoint, key: 'default' }));
      return;
    }
    registered.forEach(({ name, forward }) => {
      schedules.push(...toManifestEntries({ endpoint, key: name, environment: name, forward }));
    });
  });
  // Only emit the manifest when something is scheduled; the Vercel assembly treats a missing
  // schedules.json as "no crons".
  if (schedules.length === 0) return;
  await context.writeBuildArtifact('schedules.json', serializer.serializeToString(schedules));
}

async function writeApi({ components, context }) {
  if (type.isNone(components.api)) return;
  if (!type.isArray(components.api)) {
    throw new LowdefyInternalError('Api is not an array.');
  }
  const writePromises = components.api.map((endpoint) => writeEndpoint({ endpoint, context }));
  await Promise.all(writePromises);
  await writeSchedulesManifest({ components, context });
}

export default writeApi;
