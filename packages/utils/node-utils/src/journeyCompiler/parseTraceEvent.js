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

// A trace event reaches the compiler in one of two spellings: the raw browser
// export, which nests `error: { name, config_key }`, and a sink export of the
// `journey_event` wide event, which flattens the error onto `error_name` and
// `config_key` (packages/api/src/routes/journey/logJourneyBatch.js). Both are
// read here so nothing below this file has to know which one it got.
function readError(row) {
  if (type.isObject(row.error) && type.isString(row.error.name)) {
    return { config_key: row.error.config_key ?? null, name: row.error.name };
  }
  if (type.isString(row.error_name) && row.error_name !== '') {
    return {
      config_key: type.isString(row.config_key) ? row.config_key : null,
      name: row.error_name,
    };
  }
  return null;
}

function readList(value) {
  return type.isArray(value) ? value.filter(type.isObject) : [];
}

function readTime(row) {
  if (type.isString(row.t)) return row.t;
  if (type.isString(row._time)) return row._time;
  return null;
}

// The compiler's vocabulary is the trace's own, so a field means the same thing
// here as it does on the wire. Returns undefined for a row that does not name a
// session, a page, a block and an event, which is every log line that is not a
// trace event.
function parseTraceEvent(row) {
  if (!type.isObject(row)) return undefined;
  const { block_id: blockId, event_name: eventName, page_id: pageId, session_id: sessionId } = row;
  if (![blockId, eventName, pageId, sessionId].every((value) => type.isString(value))) {
    return undefined;
  }

  const error = readError(row);
  return {
    // Not on the wire today; read here so a recorder that adds it needs no
    // compiler change. Without it a block's valueType comes from the build.
    block_id: blockId,
    block_type: type.isString(row.block_type) ? row.block_type : null,
    actions: readList(row.actions),
    error,
    event_name: eventName,
    page_id: pageId,
    page_instance: type.isString(row.page_instance) ? row.page_instance : null,
    payload: type.isObject(row.payload) ? row.payload : null,
    requests: readList(row.requests),
    rid: type.isString(row.rid) ? row.rid : null,
    session_id: sessionId,
    state_writes: readList(row.state_writes),
    // An error names a failure whatever the success field says, and a line with
    // neither is a success.
    success: row.success !== false && type.isNone(error),
    t: readTime(row),
    url_after: type.isString(row.url_after) ? row.url_after : null,
  };
}

export default parseTraceEvent;
