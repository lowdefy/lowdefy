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

import parseTraceEvent from './parseTraceEvent.js';

function parseLines({ trace }) {
  const rows = [];
  let unparsable = 0;
  trace
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .forEach((line) => {
      try {
        rows.push(JSON.parse(line));
      } catch {
        // A trace file is appended to by a running sink, so a truncated final
        // line is normal. Counting it beats losing the corpus to it.
        unparsable += 1;
      }
    });
  return { rows, unparsable };
}

// A trace is a file of one JSON object per line, or the rows a sink query
// already returned. Rows that are not trace events (every other wide event in
// the same file) are skipped without comment - a mixed log is the expected
// input, not an error.
function parseTraceEvents({ trace }) {
  if (!type.isArray(trace) && !type.isString(trace)) {
    throw new Error(
      `Journey compiler requires a trace as JSONL text or an array of rows. Received ${JSON.stringify(
        trace
      )}.`
    );
  }
  const { rows, unparsable } = type.isArray(trace)
    ? { rows: trace, unparsable: 0 }
    : parseLines({ trace });

  const events = [];
  rows.forEach((row) => {
    const event = parseTraceEvent(row);
    if (!type.isUndefined(event)) events.push(event);
  });
  return { events, unparsable };
}

export default parseTraceEvents;
