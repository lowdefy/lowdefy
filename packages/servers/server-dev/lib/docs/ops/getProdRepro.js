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

// P2's trace → journey compiler is not landed yet, so this returns the raw
// material it will consume rather than pretending to compile: the session's
// events in order with the page and block ids an agent needs to write the
// journey by hand today. The note says so explicitly — a tool that quietly
// returned an empty journey would read as "nothing to reproduce".
async function getProdRepro({ origin, rid }) {
  if (!type.isString(rid) || rid === '') {
    throw new Error(`lowdefy_prod_repro requires a "rid" string. Received ${JSON.stringify(rid)}.`);
  }
  return runOpsTool({
    origin,
    tool: 'lowdefy_prod_repro',
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
        page_id: getEventField(row, 'page_id'),
        block_id: getEventField(row, 'block_id'),
        request_id: getEventField(row, 'request_id'),
        endpoint_id: getEventField(row, 'endpoint_id'),
        step_id: getEventField(row, 'step_id'),
        success: getEventField(row, 'success'),
        error_name: getEventField(row, 'error.name'),
        error_message: getEventField(row, 'error.message'),
        ...resolveEventSource({
          configKey: getEventField(row, 'config_key'),
          gitSha: getEventField(row, 'git_sha'),
        }),
      }));
      const pageIds = [
        ...new Set(events.map((event) => event.page_id).filter((id) => !type.isNone(id))),
      ];
      const blockIds = [
        ...new Set(events.map((event) => event.block_id).filter((id) => !type.isNone(id))),
      ];
      return {
        note: 'compiler pending',
        rid,
        page_ids: pageIds,
        block_ids: blockIds,
        events,
        retention:
          'Only events inside the sink retention window (30 days unless the sink is configured otherwise) can be reproduced.',
      };
    },
  });
}

export default getProdRepro;
