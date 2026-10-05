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

import foldInteractions from './foldInteractions.js';
import normaliseRecords from './normaliseRecords.js';
import recordTime from './recordTime.js';
import segmentSession from './segmentSession.js';

function toTime(value) {
  if (type.isNone(value)) return undefined;
  const time = type.isNumber(value) ? value : new Date(value).getTime();
  if (Number.isNaN(time)) {
    throw new Error(
      `Journey compiler requires "since" and "until" to be dates. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  return time;
}

function inWindow({ record, since, until }) {
  const time = recordTime({ record });
  if (!type.isUndefined(since) && time < since) return false;
  return type.isUndefined(until) || time <= until;
}

// Section 3.1, steps 1 to 6: validate and group the records, keep the
// requested source and time window, cut segments and fold them. Production
// text needs no pass of its own: the readers resolve a clicked-text token to
// text only when it is config text, so a production record arrives holding
// config text or a token. Returns the folded segments, each an array of
// records, and what was dropped.
function prepareSegments({ records, source, filters = {} }) {
  const { sessions, dropped } = normaliseRecords({ records });
  const since = toTime(filters.since);
  const until = toTime(filters.until);

  const segments = [];
  sessions.forEach((session) => {
    const kept = session.records.filter(
      (record) => record.source === source && inWindow({ record, since, until })
    );
    if (kept.length === 0) return;
    segmentSession({ records: kept }).forEach((segment) => {
      const folded = foldInteractions({ records: segment });
      if (folded.length > 0) segments.push(folded);
    });
  });

  return { segments, dropped };
}

export default prepareSegments;
