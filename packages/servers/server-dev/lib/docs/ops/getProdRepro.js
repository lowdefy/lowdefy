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

import { collectBlockTypes, compileTrace } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import createResolveEventSource from './createResolveEventSource.js';
import getEventField from './getEventField.js';
import readBuildArtifact from '../readBuildArtifact.js';
import runOpsTool from './runOpsTool.js';

const TRACE_LIMIT = 500;

const TRACE_FIELDS = [
  'actions',
  'block_id',
  'config_key',
  'error_name',
  'event_name',
  'page_id',
  'page_instance',
  'payload',
  'requests',
  'rid',
  'session_id',
  'state_writes',
  'success',
  'url_after',
];

// A sink writes a wide event either nested or flattened, so every field is read
// through getEventField before the compiler sees it.
function toTraceRow(row) {
  const traceRow = { t: getEventField(row, 't') ?? row._time ?? null };
  TRACE_FIELDS.forEach((field) => {
    const value = getEventField(row, field);
    if (!type.isNone(value)) traceRow[field] = value;
  });
  return traceRow;
}

// The block types of the pages the trace touched, so a change on an input block
// compiles to a `set` step. Resolved against this working tree's build, the
// same way `source` is.
function readBlockTypes({ traceRows }) {
  const blockTypes = {};
  [...new Set(traceRows.map((row) => row.page_id).filter(type.isString))].forEach((pageId) => {
    const page = readBuildArtifact({ name: `pages/${pageId}.json`, deserialize: true });
    if (type.isNone(page)) return;
    collectBlockTypes({ blockTypes, page, pageId });
  });
  return blockTypes;
}

// Everything one rid recorded, compiled into a journey. The compiler stops at
// the event that failed, so what comes back is the reproduction: the steps that
// led to the failure and the expectation that the last one succeeds, which is a
// failing test until the bug is fixed.
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

      const traceRows = rows
        .filter((row) => getEventField(row, 'event') === 'journey_event')
        .map(toTraceRow);
      const { candidates, dropped } = compileTrace({
        blockMetas: readBuildArtifact({ name: 'plugins/blockMetas.json' }) ?? {},
        blockTypes: readBlockTypes({ traceRows }),
        trace: traceRows,
      });
      // A rid can carry more than one session's beacon, and the one that failed
      // is the one being reproduced.
      const candidate =
        candidates.find((entry) => !type.isUndefined(entry.origin.failure)) ?? candidates[0];

      return {
        rid,
        journey: candidate?.journey ?? null,
        journey_yaml: candidate?.contents ?? null,
        journey_origin: candidate?.origin ?? null,
        other_candidates: candidates.length > 1 ? candidates.length - 1 : 0,
        dropped,
        page_ids: [
          ...new Set(events.map((event) => event.page_id).filter((id) => !type.isNone(id))),
        ],
        block_ids: [
          ...new Set(events.map((event) => event.block_id).filter((id) => !type.isNone(id))),
        ],
        events,
        note: type.isUndefined(candidate)
          ? 'No journey_event carries this rid, so there is nothing to compile. The events below are what the rid did record.'
          : 'Move journey_yaml into tests/journeys/, add the fixtures it needs and run `lowdefy test --update` to fill the expectations left unfilled.',
        retention:
          'Only events inside the sink retention window (30 days unless the sink is configured otherwise) can be reproduced.',
      };
    },
  });
}

export default getProdRepro;
