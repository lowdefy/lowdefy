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

// Two kinds of record are noise rather than steps.
//
// A bounced record is a debounced event whose actions never ran. The engine
// logs it (packages/engine/src/Events.js) and the recorder already drops it,
// but a trace exported from a sink or written by an older recorder still
// carries it, and compiling it puts a phantom step in every journey that
// touches a search box.
//
// An event whose actions are all `pending` is an `async: true` chain that
// resolved after the record was built, so its outcome is unknown. A step whose
// success nobody observed is not evidence of anything.
function dropReason({ event }) {
  if (event.success === true && event.actions.length === 0 && event.requests.length === 0) {
    return 'bounced';
  }
  if (event.actions.length > 0 && event.actions.every((action) => action.outcome === 'pending')) {
    return 'pending';
  }
  return undefined;
}

export default dropReason;
