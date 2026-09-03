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

import resolveMonitorSource from './resolveMonitorSource.js';

// A connection's own health is the ServiceError share of its traffic:
// `error.name` separates "the database is down" from "the app sent a bad
// query", and only the first is worth waking someone for.
function collectConnectionMonitors({ components, context, defaults }) {
  return (components.connections ?? [])
    .filter((connection) => !type.isNone(connection?.connectionId ?? connection?.id))
    .map((connection) => {
      const connectionId = connection.connectionId ?? connection.id;
      const configKey = connection['~k'];
      const filter = { connection_id: connectionId };
      return {
        id: `connection:${connectionId}:service_error_rate`,
        unit: { type: 'connection', id: connectionId },
        event: 'request_failed',
        description: `Connection "${connectionId}" is returning service errors on more than ${
          defaults.error_rate * 100
        }% of its requests.`,
        rule: {
          type: 'error_rate',
          window_minutes: defaults.window_minutes,
          threshold: defaults.error_rate,
          comparison: 'above',
          failure: { event: 'request_failed', filter: { ...filter, 'error.name': 'ServiceError' } },
          total: { events: ['request_completed', 'request_failed'], filter },
        },
        config_key: configKey ?? null,
        source: resolveMonitorSource({ configKey, context }),
        status: 'active',
      };
    });
}

export default collectConnectionMonitors;
