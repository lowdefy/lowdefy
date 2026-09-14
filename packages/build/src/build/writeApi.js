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

import getCronEnvironmentNames from '../utils/getCronEnvironmentNames.js';

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
// With config.cron.environments declared there is one entry per enabled environment and schedule:
// `environment` names it and `forward` is true for environments the production deployment forwards
// to (those with a url) — Vercel fires crons only on production, so every environment's schedules
// must be registered there.
function getSchedules({ endpoint, environment }) {
  if (type.isArray(endpoint.schedules)) return endpoint.schedules;
  return endpoint.schedules?.[environment] ?? [];
}

function pushSchedules({ endpoint, environment, forward }) {
  return getSchedules({ endpoint, environment }).map((schedule) => ({
    endpointId: endpoint.endpointId,
    cron: schedule.cron,
    payload: schedule.payload ?? {},
    ...(type.isUndefined(environment) ? {} : { environment, forward }),
  }));
}

async function writeSchedulesManifest({ components, context }) {
  const cronEnvironments = components.config?.cron?.environments;
  const environmentNames = getCronEnvironmentNames(cronEnvironments);
  const schedules = [];
  (components.api ?? []).forEach((endpoint) => {
    if (environmentNames.length === 0) {
      schedules.push(...pushSchedules({ endpoint }));
      return;
    }
    environmentNames.forEach((environment) => {
      const config = cronEnvironments[environment];
      if (config.enabled === false) return;
      schedules.push(
        ...pushSchedules({
          endpoint,
          environment,
          forward: !type.isUndefined(config.url),
        })
      );
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
