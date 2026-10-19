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

import attachFrustration from './attachFrustration.js';
import pairFailures from './pairFailures.js';
import postHogRowToRecord from './postHogRowToRecord.js';

const INTERACTION_EVENTS = ['$autocapture', '$rageclick', '$dead_click'];

function compareEntries(a, b) {
  const timeA = Date.parse(a.record.t);
  const timeB = Date.parse(b.record.t);
  if (timeA !== timeB) return timeA - timeB;
  return String(a.id).localeCompare(String(b.id));
}

// One UTC day of PostHog rows as production trace records, ordered by time
// then row uuid, with the counts its manifest reports. Pairing runs within
// the day, so a failure just after midnight whose click fell before it stays
// an engine record.
function buildDayRecords({ rows, salt }) {
  const dropped = {};
  const rowsByEvent = {};
  let enriched = 0;
  let interactions = 0;
  let chainFallbacks = 0;
  const records = [];
  const frustrations = [];
  const failures = [];

  rows.forEach((row) => {
    rowsByEvent[row.event] = (rowsByEvent[row.event] ?? 0) + 1;
    if (INTERACTION_EVENTS.includes(row.event)) {
      interactions += 1;
      if (type.isString(row.lowdefy_block_id) && row.lowdefy_block_id !== '') enriched += 1;
    }
    const mapped = postHogRowToRecord({ row, salt });
    if (mapped.dropped) {
      dropped[mapped.dropped] = (dropped[mapped.dropped] ?? 0) + 1;
      return;
    }
    if (mapped.chainFallback) chainFallbacks += 1;
    if (mapped.failure) {
      failures.push(mapped);
      return;
    }
    if (mapped.frustration) {
      frustrations.push({ record: mapped.frustration, id: mapped.id, blockIds: mapped.blockIds });
      return;
    }
    records.push({ record: mapped.record, id: mapped.id, blockIds: mapped.blockIds });
  });

  const withFrustration = attachFrustration({ records, frustrations });
  const paired = pairFailures({ records: withFrustration, failures });
  return {
    records: paired.sort(compareEntries).map((entry) => entry.record),
    dropped,
    rowsByEvent,
    interactions,
    enriched,
    chainFallbacks,
  };
}

export default buildDayRecords;
