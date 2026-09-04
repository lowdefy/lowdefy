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

import createResolveEventSource from './createResolveEventSource.js';
import getEventField from './getEventField.js';
import runOpsTool from './runOpsTool.js';

const TRACE_LIMIT = 500;

// Every event carrying one rid, oldest first: the request that failed, the
// endpoint steps under it, the agent tool calls it made. `source` is resolved
// per event, so the next call is lowdefy_find_config on a file:line rather
// than a grep for a config_key.
async function getProdTrace({ origin, rid }) {
  if (!type.isString(rid) || rid === '') {
    throw new Error(`lowdefy_prod_trace requires a "rid" string. Received ${JSON.stringify(rid)}.`);
  }
  return runOpsTool({
    origin,
    tool: 'lowdefy_prod_trace',
    params: { rid },
    run: async ({ adapter }) => {
      const rows = await adapter.query({
        where: [['rid', 'eq', rid]],
        order: 'asc',
        limit: TRACE_LIMIT,
      });
      const resolveEventSource = createResolveEventSource();
      const events = rows.map((row) => ({
        time: row._time ?? null,
        event: getEventField(row, 'event'),
        success: getEventField(row, 'success'),
        duration_ms: getEventField(row, 'duration_ms'),
        page_id: getEventField(row, 'page_id'),
        block_id: getEventField(row, 'block_id'),
        request_id: getEventField(row, 'request_id'),
        endpoint_id: getEventField(row, 'endpoint_id'),
        step_id: getEventField(row, 'step_id'),
        error_name: getEventField(row, 'error.name'),
        error_message: getEventField(row, 'error.message'),
        error_hint: getEventField(row, 'error.hint'),
        git_sha: getEventField(row, 'git_sha'),
        app_version: getEventField(row, 'app_version'),
        ...resolveEventSource({
          configKey: getEventField(row, 'config_key'),
          gitSha: getEventField(row, 'git_sha'),
        }),
      }));
      return {
        rid,
        events,
        note:
          events.length === 0
            ? 'No event carries this rid. The sink only holds its retention window (30 days unless the sink is configured otherwise), so a rid older than that is gone.'
            : null,
      };
    },
  });
}

export default getProdTrace;
