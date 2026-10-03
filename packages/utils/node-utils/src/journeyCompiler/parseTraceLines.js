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

// JSONL text to record objects. A trace file is appended to by a running
// sink, so a truncated last line is normal: a line that is not JSON is
// counted, never thrown, and the rest of the trace still compiles.
function parseTraceLines({ text }) {
  if (!type.isString(text)) {
    throw new Error(
      `Journey compiler requires a trace as JSONL text. Received ${JSON.stringify(text)}.`
    );
  }
  const records = [];
  let unparsable = 0;
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .forEach((line) => {
      try {
        records.push(JSON.parse(line));
      } catch {
        unparsable += 1;
      }
    });
  return { records, unparsable };
}

export default parseTraceLines;
