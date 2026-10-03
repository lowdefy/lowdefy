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

import parseSince from './parseSince.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAYS_PATTERN = /^(\d+)d$/;
const DEFAULT_SINCE = '30d';

function toDay(time) {
  return new Date(time).toISOString().slice(0, 10);
}

function checkDay({ flag, day }) {
  if (!DAY_PATTERN.test(day) || toDay(Date.parse(`${day}T00:00:00Z`)) !== day) {
    throw new Error(`${flag} takes a UTC date as YYYY-MM-DD. Received "${day}".`);
  }
}

// The production window of whole UTC days, as { from, to } (`YYYY-MM-DD`,
// both included), shared by compile, coverage and evidence. `--since 30d` (the
// default) is the 30 days ending today; another duration or a date starts on
// the UTC day it reaches back to. `--from` and `--to` go together, and never
// with `--since`.
function parseTraceWindow({ since, from, to, now }) {
  const explicit = !type.isNone(from) || !type.isNone(to);
  if (explicit) {
    if (!type.isNone(since)) {
      throw new Error(
        '--from and --to are an explicit window instead of --since; pass one or the other.'
      );
    }
    if (type.isNone(from) || type.isNone(to)) {
      throw new Error('--from and --to go together: pass both days of the window.');
    }
    checkDay({ flag: '--from', day: from });
    checkDay({ flag: '--to', day: to });
    if (from > to) {
      throw new Error(`--from should not be after --to. Received ${from} to ${to}.`);
    }
    return { from, to };
  }
  const value = since ?? DEFAULT_SINCE;
  const today = toDay(now);
  const days = DAYS_PATTERN.exec(value);
  if (days !== null) {
    const count = Number(days[1]);
    if (count < 1) {
      throw new Error(`--since takes at least one day. Received "${value}".`);
    }
    return { from: toDay(Date.parse(`${today}T00:00:00Z`) - (count - 1) * DAY_MS), to: today };
  }
  const start = parseSince({ since: value, now });
  const startDay = toDay(start);
  return { from: startDay > today ? today : startDay, to: today };
}

export default parseTraceWindow;
