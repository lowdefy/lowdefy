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

import validateTraceRecord, { TRACE_VERSION } from '../journeyTrace/validateTraceRecord.js';
import recordTime from './recordTime.js';

const MAX_REASONS = 5;

function isOtherVersion({ record }) {
  return type.isObject(record) && !type.isNone(record.v) && record.v !== TRACE_VERSION;
}

// The records as the rest of the compiler sees them: valid v1 records only,
// grouped by tab session, ordered by time. Everything left out is counted, and
// the first few reasons kept, so the command can say what it threw away
// instead of quietly compiling half a corpus. A record of another version is
// counted apart from an invalid one: it is a newer recorder, not a broken one.
function normaliseRecords({ records }) {
  if (!type.isArray(records)) {
    throw new Error(
      `Journey compiler requires trace records as an array. Received ${JSON.stringify(records)}.`
    );
  }
  const dropped = { invalid: 0, otherVersion: 0, reasons: [] };
  const bySession = new Map();
  records.forEach((record) => {
    if (isOtherVersion({ record })) {
      dropped.otherVersion += 1;
      return;
    }
    const { error } = validateTraceRecord({ record });
    if (!type.isUndefined(error)) {
      dropped.invalid += 1;
      if (dropped.reasons.length < MAX_REASONS) dropped.reasons.push(error);
      return;
    }
    if (!bySession.has(record.session)) bySession.set(record.session, []);
    bySession.get(record.session).push(record);
  });

  // Array.prototype.sort is stable, so records with the same time keep the
  // order the trace gave them.
  const sessions = [...bySession.entries()].map(([session, sessionRecords]) => ({
    session,
    records: [...sessionRecords].sort(
      (a, b) => recordTime({ record: a }) - recordTime({ record: b })
    ),
  }));
  sessions.sort(
    (a, b) => recordTime({ record: a.records[0] }) - recordTime({ record: b.records[0] })
  );
  return { sessions, dropped };
}

export default normaliseRecords;
