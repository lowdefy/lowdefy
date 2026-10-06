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

import fs from 'fs';
import path from 'path';
import { parseTraceLines } from '@lowdefy/node-utils';

import resolveRecordText from './resolveRecordText.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function shiftDay({ day, by }) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10);
}

// The production records of whole calendar months, for evidence refresh: every
// final day of each month asked for, read from the per-day cache whatever gaps
// it has (unlike readProductionTrace, which refuses a gap in its window). The
// final day just outside a month is read too, so a session that crosses
// midnight at a month boundary compiles whole; the caller buckets segments by
// the month they started in and drops the ones that started outside. Every
// clicked-text token is resolved as readProductionTrace resolves it, so the
// records hold config text and tokens only.
//
// - finalDays: listFinalDays's result.
// - months: the `YYYY-MM` months to read.
// - resolve: createTokenResolver's resolver for this machine's salt and the
//   app's config text set.
function readProductionMonths({ directories, finalDays, months, resolve }) {
  const directory = path.join(directories.traces, 'production');
  const final = new Set(finalDays);
  const days = finalDays.filter((day) => months.includes(day.slice(0, 7)));
  const read = new Set(days);
  const neighbours = new Set();
  days.forEach((day) => {
    [-1, 1].forEach((by) => {
      const neighbour = shiftDay({ day, by });
      if (final.has(neighbour) && !read.has(neighbour)) neighbours.add(neighbour);
    });
  });
  const records = [];
  let unparsable = 0;
  [...days, ...neighbours].sort().forEach((day) => {
    const parsed = parseTraceLines({
      text: fs.readFileSync(path.join(directory, `${day}.jsonl`), 'utf8'),
    });
    records.push(...parsed.records.map((record) => resolveRecordText({ record, resolve })));
    unparsable += parsed.unparsable;
  });
  return { records, unparsable, days };
}

export default readProductionMonths;
