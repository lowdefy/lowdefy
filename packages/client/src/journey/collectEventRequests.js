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

// The requests this event's chain fired. `context.requests[requestId]` is a
// newest-first call history whose entries carry the id of the action that made
// the call, so the newest call of each request belongs to this event exactly
// when that action is one of the event's own.
function collectEventRequests({ context, responses }) {
  const requests = [];
  Object.keys(context.requests ?? {}).forEach((requestId) => {
    const call = (context.requests[requestId] ?? [])[0];
    if (type.isNone(call) || !(call.actionId in responses)) return;
    requests.push({
      request_id: requestId,
      success: type.isNone(call.error),
      duration_ms: call.responseTime ?? null,
    });
  });
  return requests;
}

export default collectEventRequests;
