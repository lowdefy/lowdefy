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

// Every event carrying one rid - the request that failed, the endpoint steps
// under it, the agent tool calls it made - or, given a session_id, every
// journey_event and feedback_submitted line of one browser session. Oldest
// first either way. `source` is resolved per event, so the next call is
// lowdefy_find_config on a file:line rather than a grep for a config_key.
//
// The session is the second axis on purpose: a feedback report carries the
// session_id of the tab it was written in, so one call turns "this is broken"
// into the ordered steps that led to it.
async function getProdTrace({ origin, rid, session_id: sessionId }) {
  const bySession = type.isString(sessionId) && sessionId !== '';
  if (!bySession && (!type.isString(rid) || rid === '')) {
    throw new Error(
      `lowdefy_prod_trace requires a "rid" or "session_id" string. Received ${JSON.stringify({
        rid,
        session_id: sessionId,
      })}.`
    );
  }
  const filter = bySession ? ['session_id', 'eq', sessionId] : ['rid', 'eq', rid];
  return runOpsTool({
    origin,
    tool: 'lowdefy_prod_trace',
    params: bySession ? { session_id: sessionId } : { rid },
    run: async ({ adapter }) => {
      const rows = await adapter.query({
        where: [filter],
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
        session_id: getEventField(row, 'session_id'),
        text: getEventField(row, 'text'),
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
      const key = bySession ? `session_id ${sessionId}` : `rid ${rid}`;
      return {
        rid: bySession ? null : rid,
        session_id: bySession ? sessionId : null,
        events,
        note:
          events.length === 0
            ? `No event carries this ${key}. The sink only holds its retention window (30 days unless the sink is configured otherwise), so anything older than that is gone. A session is also only in the sink if it was sampled (logger.journeys.sample_rate).`
            : null,
      };
    },
  });
}

export default getProdTrace;
