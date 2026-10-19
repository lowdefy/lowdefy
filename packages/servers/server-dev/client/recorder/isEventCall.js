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

// Whether the newest call of a request or endpoint was made by this event.
// Action ids are config ids, not unique across blocks or runs, so an id in
// the event's responses is not enough: the call must come from the event's
// own block, and from an action this run did not skip (a skipped action keeps
// its response entry while the call history still holds an earlier run's).
function isEventCall({ blockId, call, responses }) {
  if (type.isNone(call) || type.isNone(call.actionId)) return false;
  if (call.blockId !== blockId || !(call.actionId in responses)) return false;
  return responses[call.actionId]?.skipped !== true;
}

export default isEventCall;
