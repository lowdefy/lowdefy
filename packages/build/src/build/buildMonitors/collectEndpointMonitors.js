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

import cronIntervalMinutes from './cronIntervalMinutes.js';
import resolveMonitorSource from './resolveMonitorSource.js';

// The longest gap a healthy schedule leaves, doubled: one missed firing is a
// coincidence a retry can absorb, two in a row is an outage.
function freshnessWindow(schedules) {
  const intervals = schedules
    .map((schedule) => cronIntervalMinutes(schedule.cron))
    .filter((interval) => !type.isNone(interval));
  if (intervals.length === 0) return null;
  // Several crons on one endpoint fire independently; the endpoint is stale
  // only once the slowest of them has missed two turns.
  return Math.max(...intervals) * 2;
}

function collectEndpointMonitors({ components, context, defaults }) {
  const monitors = [];
  (components.api ?? []).forEach((endpoint) => {
    if (type.isNone(endpoint?.endpointId)) return;
    const endpointId = endpoint.endpointId;
    const configKey = endpoint['~k'];
    const source = resolveMonitorSource({ configKey, context });
    const filter = { endpoint_id: endpointId };
    monitors.push({
      id: `endpoint:${endpointId}:error_rate`,
      unit: { type: 'endpoint', id: endpointId },
      event: 'endpoint_failed',
      description: `Endpoint "${endpointId}" is failing more than ${
        defaults.error_rate * 100
      }% of the time.`,
      rule: {
        type: 'error_rate',
        window_minutes: defaults.window_minutes,
        threshold: defaults.error_rate,
        comparison: 'above',
        failure: { event: 'endpoint_failed', filter },
        total: { events: ['endpoint_completed', 'endpoint_failed'], filter },
      },
      config_key: configKey ?? null,
      source,
      status: 'active',
    });

    const schedules = type.isArray(endpoint.schedules) ? endpoint.schedules : [];
    if (schedules.length === 0) return;
    const windowMinutes = freshnessWindow(schedules);
    if (type.isNone(windowMinutes)) return;
    monitors.push({
      id: `endpoint:${endpointId}:freshness`,
      unit: { type: 'endpoint', id: endpointId },
      event: 'endpoint_completed',
      description: `Scheduled endpoint "${endpointId}" has not completed in ${windowMinutes} minutes.`,
      rule: {
        type: 'freshness',
        window_minutes: windowMinutes,
        threshold: 1,
        comparison: 'below',
        expect: { event: 'endpoint_completed', filter },
        crons: schedules.map((schedule) => schedule.cron),
      },
      config_key: configKey ?? null,
      source,
      status: 'active',
    });
  });
  return monitors;
}

export default collectEndpointMonitors;
