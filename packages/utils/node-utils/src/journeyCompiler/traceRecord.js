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

// Builds v1 trace records for the compiler's tests: `at` is seconds after a
// fixed start, `block` and `text` fill the target. Everything else passes
// through, so a test states only what its scenario is about.
const START = Date.parse('2026-09-28T14:00:00.000Z');

function traceRecord({
  at = 0,
  block,
  text,
  option,
  row,
  column,
  nth,
  blockType,
  kind = 'click',
  source = 'dev',
  session = 's-1',
  page = 'tickets',
  ...rest
}) {
  const record = {
    v: 1,
    source,
    session,
    person: null,
    org: null,
    roles: null,
    t: new Date(START + Math.round(at * 1000)).toISOString(),
    build: null,
    page_id: page,
    scope: 'page',
    kind,
    target: null,
  };
  if (['click', 'change', 'key'].includes(kind) && (block !== undefined || text !== undefined)) {
    record.target = {
      block_id: block ?? null,
      block_type: blockType ?? null,
      row: row ?? null,
      column: column ?? null,
      text: text ?? null,
      nth: nth ?? null,
      option: option ?? false,
    };
  }
  if (source !== 'production') record.event = null;
  return { ...record, ...rest };
}

export default traceRecord;
