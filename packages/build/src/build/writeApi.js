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

async function writeEndpoint({ endpoint, context }) {
  await context.writeBuildArtifact(
    `api/${endpoint.endpointId}.json`,
    serializer.serializeToString(endpoint ?? {})
  );
}

// Flat manifest of every scheduled endpoint, consumed by the Vercel Build Output assembly to
// generate the `crons` array in config.json. The runtime reads schedules off the endpoint artifact
// directly, so it does not depend on this file.
async function writeSchedulesManifest({ components, context }) {
  const schedules = [];
  (components.api ?? []).forEach((endpoint) => {
    (endpoint.schedules ?? []).forEach((schedule) => {
      schedules.push({
        endpointId: endpoint.endpointId,
        cron: schedule.cron,
        payload: schedule.payload ?? {},
      });
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
