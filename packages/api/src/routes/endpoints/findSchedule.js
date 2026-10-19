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

import { ConfigError } from '@lowdefy/errors';

// Vercel sends the firing expression in x-vercel-cron-schedule; cron expressions are unique per
// endpoint and environment (enforced at build) so this is unambiguous. Without a cron (e.g. local
// testing) fall back to the single schedule, otherwise require it to disambiguate the payload.
function findSchedule({ schedules, cron, endpointId, environment }) {
  const where = environment === undefined ? '' : ` for environment "${environment}"`;
  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new ConfigError(`API Endpoint "${endpointId}" is not scheduled${where}.`);
  }
  let schedule;
  if (cron) {
    schedule = schedules.find((s) => s.cron === cron);
  } else if (schedules.length === 1) {
    schedule = schedules[0];
  }
  if (!schedule) {
    throw new ConfigError(
      `No schedule matching cron "${cron}" for API Endpoint "${endpointId}"${where}.`
    );
  }
  return schedule;
}

export default findSchedule;
