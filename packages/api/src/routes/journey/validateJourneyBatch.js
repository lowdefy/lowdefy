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

const MAX_EVENTS = 200;
const MAX_STRING = 512;

function isId(value) {
  return type.isString(value) && value.length > 0 && value.length <= MAX_STRING;
}

function isValidEvent(event) {
  if (!type.isObject(event)) return false;
  if (!isId(event.session_id)) return false;
  if (!isId(event.page_id)) return false;
  if (!isId(event.block_id)) return false;
  if (!isId(event.event_name)) return false;
  if (!type.isBoolean(event.success)) return false;
  if (!type.isNone(event.actions) && !type.isArray(event.actions)) return false;
  if (!type.isNone(event.requests) && !type.isArray(event.requests)) return false;
  if (!type.isNone(event.state_writes) && !type.isArray(event.state_writes)) return false;
  return true;
}

// /api/journey is an unauthenticated same-origin write path into the app's
// logs, so the batch is checked before anything is emitted: a malformed body
// is a 400, not a line in the sink. The event fields the emitter reads are
// picked explicitly (logJourneyBatch), so passing this check does not let a
// caller name its own log fields.
function validateJourneyBatch(batch) {
  if (!type.isObject(batch)) {
    return { message: 'Journey batch should be an object.', valid: false };
  }
  if (!type.isArray(batch.events)) {
    return { message: 'Journey batch "events" should be an array.', valid: false };
  }
  if (batch.events.length > MAX_EVENTS) {
    return { message: `Journey batch should hold at most ${MAX_EVENTS} events.`, valid: false };
  }
  const invalid = batch.events.findIndex((event) => !isValidEvent(event));
  if (invalid !== -1) {
    return {
      message: `Journey event at index ${invalid} is not a valid trace event.`,
      valid: false,
    };
  }
  return { valid: true };
}

export default validateJourneyBatch;
